"use strict";
const lexer_1 = require("odata-v4-parser/lib/lexer");
const ODataParser = require("odata-v4-parser");
const extend = require("extend");
const url = require("url");
const qs = require("qs");
const util = require("util");
const stream_1 = require("stream");
const utils_1 = require("./utils");
const result_1 = require("./result");
const visitor_1 = require("./visitor");
const edm_1 = require("./edm");
const odata_1 = require("./odata");
const error_1 = require("./error");
const getODataRoot = function (context) {
    return (context.protocol || "http") + "://" + (context.host || "localhost") + (context.base || "");
};
const createODataContext = function (context, entitySets, server, resourcePath) {
    let odataContextBase = getODataRoot(context) + "/$metadata#";
    let odataContext = "";
    let prevResource = null;
    let prevType = server;
    resourcePath.navigation.forEach((baseResource, i) => {
        let next = resourcePath.navigation[i + 1];
        if (next && next.type == lexer_1.TokenType.RefExpression)
            return;
        if (baseResource.type == lexer_1.TokenType.EntitySetName) {
            prevResource = baseResource;
            prevType = baseResource.key ? entitySets[baseResource.name].prototype.elementType : entitySets[baseResource.name];
            odataContext += baseResource.name;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1)
                return odataContext += "/$entity";
            if (baseResource.key) {
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
        }
        else if (getResourcePartFunction(baseResource.type) && !(baseResource.name in expCalls)) {
            odataContext = "";
            if (prevResource) {
                let target = prevType || entitySets[prevResource.name];
                if (!target)
                    return;
                let propertyKey = baseResource.name.split(".").pop();
                let returnType = edm_1.Edm.getReturnType(target, propertyKey);
                let returnTypeName = edm_1.Edm.getReturnTypeName(target, propertyKey);
                if (typeof returnType == "function") {
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets) {
                        if (entitySets[prop] == ctrl) {
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? "" : "/$entity") : returnTypeName;
                }
                return odataContext += returnTypeName;
            }
            else {
                let call = baseResource.name;
                let returnType = edm_1.Edm.getReturnType(server, call);
                let returnTypeName = edm_1.Edm.getReturnTypeName(server, call);
                if (typeof returnType == "function") {
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets) {
                        if (entitySets[prop] == ctrl) {
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? "" : "/$entity") : returnTypeName;
                }
                return odataContext += returnTypeName;
            }
        }
        if (baseResource.type == lexer_1.TokenType.EntityCollectionNavigationProperty) {
            prevResource = baseResource;
            odataContext += "/" + baseResource.name;
            prevType = baseResource.key ? edm_1.Edm.getType(prevType, baseResource.name) : server.getController(edm_1.Edm.getType(prevType, baseResource.name));
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1)
                return odataContext += "/$entity";
            if (baseResource.key) {
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
            return odataContext;
        }
        if (baseResource.type == lexer_1.TokenType.EntityNavigationProperty) {
            prevResource = baseResource;
            prevType = edm_1.Edm.getType(prevType, baseResource.name);
            return odataContext += "/" + baseResource.name;
        }
        if (baseResource.type == lexer_1.TokenType.PrimitiveProperty ||
            baseResource.type == lexer_1.TokenType.PrimitiveCollectionProperty ||
            baseResource.type == lexer_1.TokenType.ComplexProperty ||
            baseResource.type == lexer_1.TokenType.ComplexCollectionProperty) {
            prevType = edm_1.Edm.getType(prevType, baseResource.name);
            return odataContext += "/" + baseResource.name;
        }
    });
    return odataContextBase + odataContext;
};
const fnCaller = function (fn, params) {
    params = params || {};
    let fnParams;
    let paramsArray = Object.keys(params);
    fnParams = utils_1.getFunctionParameters(fn);
    for (var i = 0; i < fnParams.length; i++) {
        fnParams[i] = params[fnParams[i]];
    }
    return fn.apply(this, fnParams);
};
const ODataRequestMethods = ["get", "post", "put", "patch", "delete"];
const ODataRequestResult = {
    get: result_1.ODataResult.Ok,
    post: result_1.ODataResult.Created,
    put: result_1.ODataResult.NoContent,
    patch: result_1.ODataResult.NoContent,
    delete: result_1.ODataResult.NoContent
};
const expCalls = {
    $count: function () {
        return this.body && this.body.value ? (this.body.value.length || 0) : 0;
    },
    $value: function () {
        if (this.stream)
            return this.stream;
        let result = this.body.value || this.body;
        for (let prop in result) {
            if (prop.indexOf("@odata") >= 0)
                delete result[prop];
        }
        return result.value || result;
    },
    $ref: function (processor) {
        let part = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 1];
        let prevPart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 2];
        let routePart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 3];
        let fn = odata_1.odata.findODataMethod(processor.prevCtrl, processor.method + "/" + prevPart.name + "/$ref", routePart.key || []);
        if (!fn)
            throw new error_1.ResourceNotFoundError();
        let linkUrl = (processor.resourcePath.id || processor.body["@odata.id"] || "").replace(getODataRoot(processor.context), "");
        let linkAst, linkPath, linkPart;
        if (linkUrl) {
            linkAst = ODataParser.odataUri(linkUrl, { metadata: processor.serverType.$metadata().edmx });
            linkPath = new visitor_1.ResourcePathVisitor().Visit(linkAst);
            linkPart = linkPath.navigation[linkPath.navigation.length - 1];
        }
        else
            linkPart = prevPart;
        let ctrl = processor.prevCtrl;
        let params = {};
        if (routePart.key)
            routePart.key.forEach((key) => params[key.name] = key.value);
        let fnDesc = fn;
        processor.__applyParams(ctrl, fnDesc.call, params, processor.url.query, this);
        fn = ctrl.prototype[fnDesc.call];
        if (fnDesc.key.length == 1 && routePart.key.length == 1 && fnDesc.key[0].to != routePart.key[0].name) {
            params[fnDesc.key[0].to] = params[routePart.key[0].name];
            delete params[routePart.key[0].name];
        }
        else {
            for (let i = 0; i < fnDesc.key.length; i++) {
                if (fnDesc.key[i].to != fnDesc.key[i].from) {
                    params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                    delete params[fnDesc.key[i].from];
                }
            }
        }
        let linkParams = {};
        if (linkPart.key)
            linkPart.key.forEach((key) => linkParams[key.name] = key.value);
        if (fnDesc.link.length == 1 && linkPart.key.length == 1 && fnDesc.link[0].to != linkPart.key[0].name) {
            params[fnDesc.link[0].to] = linkParams[linkPart.key[0].name];
        }
        else {
            for (let i = 0; i < fnDesc.link.length; i++) {
                params[fnDesc.link[i].to] = linkParams[fnDesc.link[i].from];
            }
        }
        let currentResult = fnCaller.call(ctrl, fn, params);
        if (isIterator(fn)) {
            currentResult = run(currentResult, [
                ODataGeneratorHandlers.PromiseHandler,
                ODataGeneratorHandlers.StreamHandler
            ]);
        }
        if (!isPromise(currentResult)) {
            currentResult = new Promise((resolve) => resolve(currentResult));
        }
        return currentResult;
    }
};
const getResourcePartFunction = (type) => {
    switch (type) {
        case "PrimitiveFunctionImportCall":
        case "PrimitiveCollectionFunctionImportCall":
        case "ComplexFunctionImportCall":
        case "ComplexCollectionFunctionImportCall":
        case "EntityFunctionImportCall":
        case "EntityCollectionFunctionImportCall":
        case "ActionImportCall":
        case "ActionImport":
            return "__actionOrFunctionImport";
        case "BoundPrimitiveFunctionCall":
        case "BoundPrimitiveCollectionFunctionCall":
        case "BoundComplexFunctionCall":
        case "BoundComplexCollectionFunctionCall":
        case "BoundEntityFunctionCall":
        case "BoundEntityCollectionFunctionCall":
        case "BoundActionCall":
        case "BoundAction":
        case "CountExpression":
        case "ValueExpression":
        case "RefExpression":
            return "__actionOrFunction";
    }
};
const writeMethods = [
    "delete",
    "post",
    "put",
    "patch"
];
let GeneratorFunction;
try {
    GeneratorFunction = eval("(function*() {}).constructor");
}
catch (err) { }
function isIterator(value) {
    return value instanceof GeneratorFunction;
}
function isPromise(value) {
    return value && typeof value.then == "function";
}
function isStream(stream) {
    return stream !== null && typeof stream == "object" && typeof stream.pipe == "function";
}
var ODataGeneratorHandlers;
(function (ODataGeneratorHandlers) {
    function PromiseHandler(request, next) {
        if (isPromise(request)) {
            return request.then(next);
        }
    }
    ODataGeneratorHandlers.PromiseHandler = PromiseHandler;
    function StreamHandler(request, next) {
        if (isStream(request)) {
            return new Promise((resolve, reject) => {
                request.on("end", resolve);
                request.on("error", reject);
            }).then(next);
        }
    }
    ODataGeneratorHandlers.StreamHandler = StreamHandler;
})(ODataGeneratorHandlers = exports.ODataGeneratorHandlers || (exports.ODataGeneratorHandlers = {}));
function run(iterator, handlers) {
    function id(x) { return x; }
    function iterate(value) {
        let next = iterator.next(value);
        let request = next.value;
        let nextAction = next.done ? id : iterate;
        for (let handler of handlers) {
            let action = handler(request, nextAction);
            if (typeof action != "undefined")
                return action;
        }
        return nextAction(request);
    }
    return iterate();
}
class ODataProcessor extends stream_1.Transform {
    constructor(context, server, options) {
        super({
            objectMode: true
        });
        this.streamStart = false;
        this.streamEnabled = false;
        this.resultCount = 0;
        this.context = context;
        this.serverType = server;
        this.options = options || {};
        let method = this.method = context.method.toLowerCase();
        if (ODataRequestMethods.indexOf(method) < 0)
            throw new error_1.MethodNotAllowedError();
        this.url = url.parse(context.url);
        this.query = qs.parse(this.url.query);
        let ast = ODataParser.odataUri(context.url, { metadata: this.serverType.$metadata().edmx });
        let resourcePath = this.resourcePath = new visitor_1.ResourcePathVisitor().Visit(ast);
        let entitySets = this.entitySets = odata_1.odata.getPublicControllers(this.serverType);
        this.odataContext = createODataContext(context, entitySets, server, resourcePath);
        if (resourcePath.navigation.length == 0)
            throw new error_1.ResourceNotFoundError();
        this.workflow = resourcePath.navigation.map((part, i) => {
            let next = resourcePath.navigation[i + 1];
            if (next && next.type == lexer_1.TokenType.RefExpression)
                return;
            let fn = this[getResourcePartFunction(part.type) || ("__" + part.type)];
            if (fn)
                return fn.call(this, part);
        }).filter(it => !!it);
    }
    _transform(chunk, encoding, done) {
        if (this.streamEnabled) {
            if (!(chunk instanceof Buffer)) {
                if (!this.streamStart) {
                    this.push('{"@odata.context":"' + this.odataContext + '","value":[');
                }
                else
                    this.push(',');
                try {
                    let entity = {};
                    this.__convertEntity(entity, chunk, this.ctrl.prototype.elementType);
                    chunk = JSON.stringify(entity);
                }
                catch (err) {
                    try {
                        chunk = chunk.toString();
                    }
                    catch (err) {
                        super.end();
                    }
                }
                finally {
                    this.streamStart = true;
                    this.push(chunk);
                }
            }
            else
                this.push(chunk);
        }
        else {
            this.resultCount++;
        }
        if (typeof done == "function")
            done();
    }
    _flush(done) {
        if (this.streamEnabled) {
            if (this.streamStart)
                this.push("]}");
            else
                this.push('{"@odata.context":"' + this.odataContext + '","value":[]}');
        }
        if (typeof done == "function")
            done();
    }
    __EntityCollectionNavigationProperty(part) {
        return (result) => {
            let resultType = result.elementType;
            let elementType = edm_1.Edm.getType(resultType, part.name);
            let partIndex = this.resourcePath.navigation.indexOf(part);
            let prevPart = this.resourcePath.navigation[partIndex - 1];
            let method = writeMethods.indexOf(this.method) >= 0 && partIndex < this.resourcePath.navigation.length - 1
                ? "get"
                : this.method;
            let fn = odata_1.odata.findODataMethod(this.ctrl, method + "/" + part.name, prevPart.key);
            if (fn) {
                let ctrl = this.ctrl;
                let fnDesc = fn;
                let params = {};
                if (prevPart.key)
                    prevPart.key.forEach((key) => params[key.name] = key.value);
                this.__applyParams(ctrl, fnDesc.call, params, this.url.query, result);
                fn = ctrl.prototype[fnDesc.call];
                if (fnDesc.key.length == 1 && prevPart.key.length == 1 && fnDesc.key[0].to != prevPart.key[0].name) {
                    params[fnDesc.key[0].to] = params[prevPart.key[0].name];
                    delete params[prevPart.key[0].name];
                }
                else {
                    for (let i = 0; i < fnDesc.key.length; i++) {
                        if (fnDesc.key[i].to != fnDesc.key[i].from) {
                            params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                            delete params[fnDesc.key[i].from];
                        }
                    }
                }
                return this.__read(ctrl, part, params, result, fn, elementType);
            }
            else {
                let ctrl = this.serverType.getController(elementType);
                let foreignKeys = edm_1.Edm.getForeignKeys(resultType, part.name);
                let typeKeys = edm_1.Edm.getKeyProperties(resultType);
                result.foreignKeys = {};
                let foreignFilter = foreignKeys.map((key) => {
                    result.foreignKeys[key] = result.body[typeKeys[0]];
                    return `${key} eq ${edm_1.Edm.escape(result.body[typeKeys[0]], edm_1.Edm.getTypeName(elementType, key))}`;
                }).join(" and ");
                let params = {};
                if (part.key)
                    part.key.forEach((key) => params[key.name] = key.value);
                return this.__read(ctrl, part, params, result, foreignFilter);
            }
        };
    }
    __EntityNavigationProperty(part) {
        return (result) => {
            let resultType = result.elementType;
            let elementType = edm_1.Edm.getType(resultType, part.name);
            let partIndex = this.resourcePath.navigation.indexOf(part);
            let prevPart = this.resourcePath.navigation[partIndex - 1];
            let method = writeMethods.indexOf(this.method) >= 0 && partIndex < this.resourcePath.navigation.length - 1
                ? "get"
                : this.method;
            let fn = odata_1.odata.findODataMethod(this.ctrl, method + "/" + part.name, prevPart.key);
            if (fn) {
                let ctrl = this.ctrl;
                let fnDesc = fn;
                let params = {};
                if (prevPart.key)
                    prevPart.key.forEach((key) => params[key.name] = key.value);
                this.__applyParams(ctrl, fnDesc.call, params, this.url.query, result);
                fn = ctrl.prototype[fnDesc.call];
                if (fnDesc.key.length == 1 && prevPart.key.length == 1 && fnDesc.key[0].to != prevPart.key[0].name) {
                    params[fnDesc.key[0].to] = params[prevPart.key[0].name];
                    delete params[prevPart.key[0].name];
                }
                else {
                    for (let i = 0; i < fnDesc.key.length; i++) {
                        if (fnDesc.key[i].to != fnDesc.key[i].from) {
                            params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                            delete params[fnDesc.key[i].from];
                        }
                    }
                }
                return this.__read(ctrl, part, params, result, fn, elementType);
            }
            else {
                let ctrl = this.serverType.getController(elementType);
                let foreignKeys = edm_1.Edm.getForeignKeys(resultType, part.name);
                let typeKeys = edm_1.Edm.getKeyProperties(elementType);
                let params = {};
                result.foreignKeys = {};
                part.key = foreignKeys.map((key) => {
                    result.foreignKeys[key] = result.body[key];
                    return {
                        name: key,
                        value: result.body[key]
                    };
                });
                if (part.key)
                    part.key.forEach((key) => params[key.name] = key.value);
                return this.__read(ctrl, part, params, result);
            }
        };
    }
    __PrimitiveProperty(part) {
        return (result) => {
            return new Promise((resolve, reject) => {
                this.__enableStreaming(part);
                let value = result.body[part.name];
                if (isStream(value)) {
                    value.pipe(this);
                    value.on("end", resolve);
                    value.on("error", reject);
                }
                else {
                    result.body = {
                        "@odata.context": result.body["@odata.context"],
                        value: value
                    };
                    if (typeof value == "object")
                        result.elementType = edm_1.Edm.getType(result.elementType, part.name) || Object;
                    resolve(result);
                }
            });
        };
    }
    __PrimitiveCollectionProperty(part) {
        return this.__PrimitiveProperty(part);
    }
    __ComplexProperty(part) {
        return this.__PrimitiveProperty(part);
    }
    __ComplexCollectionProperty(part) {
        return this.__PrimitiveProperty(part);
    }
    __read(ctrl, part, params, data, filter, elementType) {
        return new Promise((resolve, reject) => {
            if (this.ctrl)
                this.prevCtrl = this.ctrl;
            else
                this.prevCtrl = ctrl;
            this.ctrl = ctrl;
            let method = writeMethods.indexOf(this.method) >= 0 && this.resourcePath.navigation.indexOf(part) < this.resourcePath.navigation.length - 1
                ? "get"
                : this.method;
            this.instance = new ctrl();
            let fn;
            if (typeof filter == "string" || !filter) {
                fn = odata_1.odata.findODataMethod(ctrl, method, part.key);
                if (!fn)
                    return reject(new error_1.ResourceNotFoundError());
                let queryString = filter ? `$filter=${filter}` : this.url.query;
                if (this.resourcePath.navigation.indexOf(part) == this.resourcePath.navigation.length - 1) {
                    queryString = Object.keys(this.query).map((p) => {
                        if (p == "$filter" && filter) {
                            this.query[p] = `(${this.query[p]}) and (${filter})`;
                        }
                        return p + "=" + this.query[p];
                    }).join("&") || queryString;
                }
                if (typeof fn != "function") {
                    let fnDesc = fn;
                    this.__applyParams(ctrl, fnDesc.call, params, queryString);
                    fn = ctrl.prototype[fnDesc.call];
                    if (fnDesc.key.length == 1 && part.key.length == 1 && fnDesc.key[0].to != part.key[0].name) {
                        params[fnDesc.key[0].to] = params[part.key[0].name];
                        delete params[part.key[0].name];
                    }
                    else {
                        for (let i = 0; i < fnDesc.key.length; i++) {
                            if (fnDesc.key[i].to != fnDesc.key[i].from) {
                                params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                                delete params[fnDesc.key[i].from];
                            }
                        }
                    }
                }
                else
                    this.__applyParams(ctrl, method, params, queryString);
            }
            else
                fn = filter;
            this.__enableStreaming(part);
            let currentResult;
            switch (method) {
                case "get":
                case "delete":
                    currentResult = fnCaller.call(ctrl, fn, params);
                    break;
                case "post":
                    this.odataContext += "/$entity";
                case "put":
                case "patch":
                    let bodyParam = odata_1.odata.getBodyParameter(ctrl, fn.name);
                    if (bodyParam)
                        params[bodyParam] = data ? extend(this.body, data.foreignKeys) : this.body;
                    if (!part.key) {
                        let properties = edm_1.Edm.getProperties((elementType || ctrl.prototype.elementType).prototype);
                        properties.forEach((prop) => {
                            if (edm_1.Edm.isKey(elementType || ctrl.prototype.elementType, prop)) {
                                params[prop] = (this.body || {})[prop] || ((data || {}).body || {})[prop];
                            }
                        });
                    }
                    currentResult = fnCaller.call(ctrl, fn, params);
                    break;
            }
            if (isIterator(fn)) {
                currentResult = run(currentResult, [
                    ODataGeneratorHandlers.PromiseHandler,
                    ODataGeneratorHandlers.StreamHandler
                ]);
            }
            if (!isPromise(currentResult)) {
                currentResult = new Promise((resolve) => resolve(currentResult));
            }
            return currentResult.then((result) => {
                if (isStream(result) && !edm_1.Edm.isMediaEntity(elementType || this.ctrl.prototype.elementType)) {
                    return new Promise((resolve, reject) => {
                        result.on("end", resolve);
                        result.on("error", reject);
                    });
                }
                if (!(result instanceof result_1.ODataResult)) {
                    return ODataRequestResult[method](result).then((result) => {
                        this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType);
                        resolve(result);
                    }, reject);
                }
                this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType);
                resolve(result);
            });
        });
    }
    __EntitySetName(part) {
        let ctrl = this.entitySets[part.name];
        let params = {};
        if (part.key)
            part.key.forEach((key) => params[key.name] = key.value);
        return (data) => {
            return this.__read(ctrl, part, params, data);
        };
    }
    __actionOrFunctionImport(part) {
        let fn = this.serverType.prototype[part.name];
        return (data) => {
            return new Promise((resolve, reject) => {
                try {
                    this.__enableStreaming(part);
                    let returnType = edm_1.Edm.getReturnType(this.serverType, part.name);
                    let isAction = false;
                    let schemas = this.serverType.$metadata().edmx.dataServices.schemas;
                    if (edm_1.Edm.isActionImport(this.serverType, part.name) ||
                        schemas.some(schema => schema.entityContainer.some(container => container.actionImports.some(actionImport => actionImport.name == part.name)))) {
                        isAction = true;
                        part.params = extend(part.params, this.body);
                    }
                    this.__applyParams(this.serverType, part.name, part.params);
                    let result = fnCaller.call(data, fn, part.params);
                    if (isIterator(fn)) {
                        result = run(result, [
                            ODataGeneratorHandlers.PromiseHandler,
                            ODataGeneratorHandlers.StreamHandler
                        ]);
                    }
                    if (isAction) {
                        return result_1.ODataResult.NoContent(result).then(resolve, reject);
                    }
                    else {
                        return result_1.ODataResult.Ok(result).then((result) => {
                            if (isStream(result.body)) {
                                result.body.on("end", resolve);
                                result.body.on("error", reject);
                            }
                            else {
                                this.__appendODataContext(result, returnType);
                                resolve(result);
                            }
                        }, reject);
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        };
    }
    __actionOrFunction(part) {
        return (result) => {
            return new Promise((resolve, reject) => {
                this.__enableStreaming(part);
                if (!result)
                    return resolve();
                let boundOpName = part.name.split(".").pop();
                let elementType = result.elementType;
                let entityBoundOp = typeof elementType == "function" ? elementType.prototype[boundOpName] : null;
                let ctrlBoundOp = this.instance[boundOpName];
                let expOp = expCalls[boundOpName];
                let scope = this.serverType;
                let returnType = Object;
                let isAction = false;
                let schemas = this.serverType.$metadata().edmx.dataServices.schemas;
                if (entityBoundOp) {
                    scope = result.body;
                    returnType = edm_1.Edm.getReturnType(elementType, boundOpName);
                    if (edm_1.Edm.isAction(elementType, boundOpName) ||
                        schemas.some(schema => schema.actions.some(action => action.name == boundOpName && action.isBound && action.parameters.some(parameter => parameter.name == "bindingParameter" && parameter.type == (elementType.namespace + "." + elementType.name))))) {
                        isAction = true;
                        part.params = extend(part.params, this.body);
                    }
                    this.__applyParams(elementType, boundOpName, part.params, null, result);
                }
                else if (ctrlBoundOp) {
                    scope = this.instance;
                    returnType = edm_1.Edm.getReturnType(this.ctrl, boundOpName);
                    if (edm_1.Edm.isAction(elementType, boundOpName) ||
                        schemas.some(schema => schema.actions.some(action => action.name == boundOpName && action.isBound && action.parameters.some(parameter => parameter.name == "bindingParameter" && parameter.type == "Collection(" + (elementType.namespace + "." + elementType.name) + ")")))) {
                        isAction = true;
                        part.params = extend(part.params, this.body);
                    }
                    this.__applyParams(this.ctrl, boundOpName, part.params, null, result);
                }
                else if (expOp) {
                    scope = result;
                    part.params["processor"] = this;
                }
                let boundOp = entityBoundOp || ctrlBoundOp || expOp;
                try {
                    let opResult = fnCaller.call(scope, boundOp, part.params);
                    if (isIterator(boundOp)) {
                        opResult = run(opResult, [
                            ODataGeneratorHandlers.PromiseHandler,
                            ODataGeneratorHandlers.StreamHandler
                        ]);
                    }
                    if (boundOp == expOp) {
                        let expResult = boundOpName == "$count" ? opResult || this.resultCount : opResult;
                        if (elementType && boundOpName == "$value" && edm_1.Edm.isMediaEntity(elementType)) {
                            this.emit("contentType", edm_1.Edm.getContentType(elementType));
                            opResult.pipe(this);
                            opResult.on("end", resolve);
                            opResult.on("error", reject);
                        }
                        else {
                            return ODataRequestResult[this.method](expResult, typeof expResult == "object" ? "application/json" : "text/plain").then((result) => {
                                if (typeof expResult == "object")
                                    result.elementType = elementType;
                                resolve(result);
                            }, reject);
                        }
                    }
                    if (isAction) {
                        return result_1.ODataResult.NoContent(opResult).then(resolve, reject);
                    }
                    return result_1.ODataResult.Ok(opResult).then((result) => {
                        if (isStream(result.body)) {
                            result.body.on("end", resolve);
                            result.body.on("error", reject);
                        }
                        else {
                            this.__appendODataContext(result, returnType);
                            resolve(result);
                        }
                    }, reject);
                }
                catch (err) {
                    reject(err);
                }
            });
        };
    }
    __appendODataContext(result, elementType) {
        if (typeof result.body == "undefined")
            return;
        let context = {
            "@odata.context": this.odataContext
        };
        if (typeof result.body == "object" && result.body) {
            if (typeof result.body["@odata.count"] == "number")
                context["@odata.count"] = result.body["@odata.count"];
            if (typeof elementType == "function" && edm_1.Edm.isMediaEntity(elementType)) {
                context["@odata.mediaReadLink"] = (this.context.protocol || "http") + "://" + (this.context.host || "localhost") + (this.context.base || "") + this.context.url + "/$value";
                context["@odata.mediaContentType"] = edm_1.Edm.getContentType(elementType);
                result.stream = result.body;
            }
            if (!result.body["@odata.context"]) {
                if (Array.isArray(result.body.value)) {
                    context.value = result.body.value;
                    result.body.value.forEach((entity, i) => {
                        if (typeof entity == "object") {
                            let item = {};
                            this.__convertEntity(item, entity, elementType);
                            context.value[i] = item;
                        }
                    });
                }
                else {
                    this.__convertEntity(context, result.body, elementType);
                }
            }
        }
        else if (typeof result.body != "undefined") {
            context.value = result.body;
        }
        result.body = context;
        result.elementType = elementType;
    }
    __convertEntity(context, result, elementType) {
        if (elementType === Object || this.options.disableEntityConversion)
            return extend(context, result);
        let props = edm_1.Edm.isOpenType(elementType) ? Object.getOwnPropertyNames(result) : edm_1.Edm.getProperties(elementType.prototype);
        if (props.length > 0) {
            props.forEach((prop) => {
                let type = edm_1.Edm.getType(elementType, prop);
                let itemType;
                if (typeof type == "function") {
                    itemType = function () { };
                    util.inherits(itemType, type);
                }
                let converter = edm_1.Edm.getConverter(elementType, prop);
                let isCollection = edm_1.Edm.isCollection(elementType, prop);
                let entity = result;
                if (isCollection && entity[prop]) {
                    let value = Array.isArray(entity[prop]) ? entity[prop] : (typeof entity[prop] != "undefined" ? [entity[prop]] : []);
                    if (typeof type == "function") {
                        context[prop] = value.map((it) => {
                            if (!it)
                                return it;
                            let item = new itemType();
                            this.__convertEntity(item, it, type);
                            return item;
                        });
                    }
                    else if (typeof converter == "function")
                        context[prop] = value.map(it => converter(it));
                    else
                        context[prop] = value;
                }
                else {
                    if (typeof type == "function" && entity[prop]) {
                        context[prop] = new itemType();
                        this.__convertEntity(context[prop], entity[prop], type);
                    }
                    else if (typeof converter == "function")
                        context[prop] = converter(entity[prop]);
                    else if (typeof entity[prop] != "undefined")
                        context[prop] = entity[prop];
                }
            });
        }
    }
    __enableStreaming(part) {
        this.streamEnabled = part == this.resourcePath.navigation[this.resourcePath.navigation.length - 1] ||
            (this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1] &&
                this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1].name == "$value");
        if (!this.streamEnabled)
            this.resultCount = 0;
    }
    __applyParams(container, name, params, queryString, result) {
        let queryParam, filterParam, contextParam, streamParam, resultParam, idParam;
        queryParam = odata_1.odata.getQueryParameter(container, name);
        filterParam = odata_1.odata.getFilterParameter(container, name);
        contextParam = odata_1.odata.getContextParameter(container, name);
        streamParam = odata_1.odata.getStreamParameter(container, name);
        resultParam = odata_1.odata.getResultParameter(container, name);
        idParam = odata_1.odata.getIdParameter(container, name);
        queryString = queryString || this.url.query;
        let queryAst = queryString ? ODataParser.query(queryString, { metadata: this.serverType.$metadata().edmx }) : null;
        if (queryParam) {
            params[queryParam] = queryAst;
        }
        if (filterParam) {
            let filter = queryString ? qs.parse(queryString).$filter : null;
            let filterAst = filter ? ODataParser.filter(filter, { metadata: this.serverType.$metadata().edmx }) : null;
            params[filterParam] = filterAst;
        }
        if (contextParam) {
            params[contextParam] = this.context;
        }
        if (streamParam) {
            params[streamParam] = this;
        }
        if (resultParam) {
            params[resultParam] = result instanceof result_1.ODataResult ? result.body : result;
        }
        if (idParam) {
            params[idParam] = decodeURI(this.resourcePath.id || this.body["@odata.id"]);
        }
    }
    execute(body) {
        this.body = body;
        this.workflow[0] = this.workflow[0].call(this, body);
        for (let i = 1; i < this.workflow.length; i++) {
            this.workflow[0] = this.workflow[0].then((...args) => {
                return this.workflow[i].apply(this, args);
            });
        }
        return this.workflow[0];
    }
}
exports.ODataProcessor = ODataProcessor;
//# sourceMappingURL=processor.js.map