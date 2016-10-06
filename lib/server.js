"use strict";
const odata_v4_service_metadata_1 = require("odata-v4-service-metadata");
const odata_v4_service_document_1 = require("odata-v4-service-document");
const lexer_1 = require("odata-v4-parser/lib/lexer");
const ODataParser = require("odata-v4-parser");
const extend = require("extend");
const es6_promise_1 = require("es6-promise");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const url = require("url");
const qs = require("qs");
const stream_1 = require("stream");
const utils_1 = require("./utils");
const result_1 = require("./result");
const controller_1 = require("./controller");
const visitor_1 = require("./visitor");
const edm_1 = require("./edm");
const odata_1 = require("./odata");
const error_1 = require("./error");
const metadata_1 = require("./metadata");
const createODataContext = function (context, entitySets, server, resourcePath) {
    let odataContextBase = (context.protocol || "http") + "://" + (context.host || "localhost") + (context.base || "") + "/$metadata#";
    let odataContext = "";
    let prevResource = null;
    resourcePath.navigation.forEach((baseResource) => {
        if (baseResource.type == lexer_1.TokenType.EntitySetName) {
            prevResource = baseResource;
            odataContext += baseResource.name;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1)
                return odataContext += "/$entity";
            if (baseResource.key) {
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
        }
        else if (getResourcePartFunction(baseResource.type)) {
            odataContext = "";
            if (prevResource) {
                let target = entitySets[prevResource.name];
                if (!target)
                    return;
                let propertyKey = baseResource.name.split(".").pop();
                let returnType = edm_1.Edm.getReturnType(target, propertyKey);
                if (typeof returnType == "function") {
                    let returnTypeName = edm_1.Edm.getReturnTypeName(target, propertyKey);
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
                return odataContext += returnType;
            }
            else {
                let call = baseResource.name;
                let returnType = edm_1.Edm.getReturnType(server, call);
                if (typeof returnType == "function") {
                    let returnTypeName = edm_1.Edm.getReturnTypeName(server, call);
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
                return odataContext += returnType;
            }
        }
        if (baseResource.type == lexer_1.TokenType.EntityCollectionNavigationProperty) {
            prevResource = baseResource;
            odataContext += "/" + baseResource.name;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1)
                return odataContext += "/$entity";
            if (baseResource.key) {
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
            return odataContext;
        }
        if (baseResource.type == lexer_1.TokenType.EntityNavigationProperty) {
            prevResource = baseResource;
            return odataContext += "/" + baseResource.name;
        }
        if (baseResource.type == lexer_1.TokenType.PrimitiveProperty ||
            baseResource.type == lexer_1.TokenType.PrimitiveCollectionProperty)
            return odataContext += "/" + baseResource.name;
    });
    return odataContextBase + odataContext;
};
const fnCaller = function (fn, body, params) {
    if (!params && body) {
        params = body;
        body = undefined;
    }
    params = params || {};
    let fnParams;
    let paramsArray = Object.keys(params);
    fnParams = utils_1.getFunctionParameters(fn);
    for (var i = 0; i < fnParams.length; i++) {
        fnParams[i] = params[fnParams[i]];
    }
    fnParams = fnParams.concat(paramsArray.map((key) => ({ name: key, value: params[key] })));
    fnParams = fnParams.filter((it) => typeof it != "undefined");
    if (body) {
        fnParams.unshift(body);
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
        return this.body.value.length;
    },
    $value: function () {
        return this.body.value || this.body;
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
            return "__actionOrFunctionImport";
        case "BoundPrimitiveFunctionCall":
        case "BoundPrimitiveCollectionFunctionCall":
        case "BoundComplexFunctionCall":
        case "BoundComplexCollectionFunctionCall":
        case "BoundEntityFunctionCall":
        case "BoundEntityCollectionFunctionCall":
            return "__actionOrFunction";
    }
};
function isIterator(value) {
    return value instanceof (function* () { }).constructor;
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
            return new es6_promise_1.Promise((resolve, reject) => {
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
    constructor(context, server) {
        super();
        this.streamStart = false;
        this.context = context;
        this.serverType = server;
        let method = this.method = context.method.toLowerCase();
        if (ODataRequestMethods.indexOf(method) < 0)
            throw new error_1.MethodNotAllowedError();
        this.url = url.parse(context.url);
        this.query = qs.parse(this.url.query);
        let ast = ODataParser.odataUri(context.url, { metadata: this.serverType.$metadata().edmx });
        let resourcePath = this.resourcePath = new visitor_1.ResourcePathVisitor().Visit(ast);
        let entitySets = this.entitySets = odata_1.odata.getPublicControllers(this.serverType);
        this.odataContext = createODataContext(context, entitySets, server, resourcePath);
        this.workflow = resourcePath.navigation.map((part) => {
            let fn = this[getResourcePartFunction(part.type) || ("__" + part.type)];
            if (fn)
                return fn.call(this, part);
            console.log(`Unhandled navigation type: ${part.type}`);
        }).filter(it => !!it);
    }
    write(chunk, encoding, done) {
        if (typeof encoding == "function") {
            done = encoding;
            encoding = undefined;
        }
        if (!(chunk instanceof Buffer)) {
            if (!this.streamStart) {
                super.write('{"@odata.context":"' + this.odataContext + '","value":[');
            }
            else
                super.write(',');
            try {
                chunk = JSON.stringify(chunk);
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
                return super.write(chunk, done);
            }
        }
        else
            return super.write(chunk, done);
    }
    _transform(chunk, encoding, done) {
        this.push(chunk);
        if (typeof done == "function")
            done();
    }
    _flush(done) {
        if (this.streamStart)
            super.write("]}");
        else
            super.write('{"@odata.context":"' + this.odataContext + '","value":[]}');
        if (typeof done == "function")
            done();
    }
    __EntityCollectionNavigationProperty(part) {
        return (result) => {
            let resultType = result.elementType;
            let elementType = edm_1.Edm.getType(resultType, part.name);
            let ctrl = this.serverType.getController(elementType);
            let foreignKeys = edm_1.Edm.getForeignKeys(resultType, part.name);
            let typeKeys = edm_1.Edm.getKeyProperties(resultType);
            let foreignFilter = foreignKeys.map((key) => {
                return `${key} eq ${edm_1.Edm.escape(result.body[typeKeys[0]], edm_1.Edm.getTypeName(elementType, key))}`;
            }).join(" and ");
            let params = {};
            if (part.key)
                part.key.forEach((key) => params[key.name] = key.value);
            return this.__read(ctrl, part, params, null, foreignFilter);
        };
    }
    __EntityNavigationProperty(part) {
        return (result) => {
            let resultType = result.elementType;
            let elementType = edm_1.Edm.getType(resultType, part.name);
            let ctrl = this.serverType.getController(elementType);
            let foreignKeys = edm_1.Edm.getForeignKeys(resultType, part.name);
            let typeKeys = edm_1.Edm.getKeyProperties(elementType);
            let params = {};
            part.key = foreignKeys.map((key) => {
                return {
                    name: key,
                    value: result.body[key]
                };
            });
            if (part.key)
                part.key.forEach((key) => params[key.name] = key.value);
            return this.__read(ctrl, part, params);
        };
    }
    __PrimitiveProperty(part) {
        return (result) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                result.body = {
                    "@odata.context": result.body["@odata.context"],
                    value: result.body[part.name]
                };
                resolve(result);
            });
        };
    }
    __PrimitiveCollectionProperty(part) {
        return this.__PrimitiveProperty(part);
    }
    __read(ctrl, part, params, data, filter) {
        return new es6_promise_1.Promise((resolve, reject) => {
            this.ctrl = ctrl;
            this.instance = new ctrl();
            let fn = odata_1.odata.findODataMethod(ctrl, this.method, part.key);
            if (!fn)
                return reject(new error_1.ResourceNotFoundError());
            let queryString = filter ? `$filter=${filter}` : this.url.query;
            if (this.resourcePath.navigation.indexOf(part) == this.resourcePath.navigation.length - 1) {
                queryString = Object.keys(this.query).map((p) => {
                    if (p == "$filter" && filter) {
                        this.query[p] = `(${this.query[p]}) and (${filter})`;
                    }
                    return p + "=" + this.query[p];
                }).join("&");
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
                this.__applyParams(ctrl, this.method, params, queryString);
            let currentResult;
            switch (this.method) {
                case "get":
                case "delete":
                    currentResult = fnCaller.call(ctrl, fn, params);
                    break;
                case "post":
                case "put":
                case "patch":
                    let bodyParam = odata_1.odata.getBodyParameter(ctrl, fn.name);
                    if (bodyParam)
                        params[bodyParam] = data;
                    if (!part.key) {
                        let properties = edm_1.Edm.getProperties(ctrl.prototype.elementType.prototype);
                        properties.forEach((prop) => {
                            if (edm_1.Edm.isKey(ctrl.prototype.elementType, prop)) {
                                params[prop] = data[prop];
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
                currentResult = new es6_promise_1.Promise((resolve) => resolve(currentResult));
            }
            return currentResult.then((result) => {
                if (isStream(result)) {
                    return new es6_promise_1.Promise((resolve, reject) => {
                        result.on("end", resolve);
                        result.on("error", reject);
                    });
                }
                if (!(result instanceof result_1.ODataResult)) {
                    return ODataRequestResult[this.method](result).then((result) => {
                        if (typeof result.body == "object" && result.body) {
                            if (!result.body["@odata.context"])
                                result.body = extend({ "@odata.context": this.odataContext }, result.body);
                        }
                        result.elementType = this.ctrl.prototype.elementType;
                        resolve(result);
                    }, reject);
                }
                if (typeof result.body == "object" && result.body) {
                    if (!result.body["@odata.context"])
                        result.body = extend({ "@odata.context": this.odataContext }, result.body);
                }
                result.elementType = this.ctrl.prototype.elementType;
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
            return new es6_promise_1.Promise((resolve, reject) => {
                try {
                    let returnType = edm_1.Edm.getReturnType(this.serverType, part.name);
                    this.__applyParams(this.serverType, part.name, part.params);
                    let result = fnCaller.call(data, fn, part.params);
                    if (edm_1.Edm.isActionImport(this.serverType, part.name)) {
                        return result_1.ODataResult.NoContent(result).then(resolve, reject);
                    }
                    else if (edm_1.Edm.isFunctionImport(this.serverType, part.name)) {
                        return result_1.ODataResult.Ok(result).then((result) => {
                            if (isStream(result.body)) {
                                result.body.on("end", resolve);
                                result.body.on("error", reject);
                            }
                            else {
                                if (typeof result.body == "object" && result.body) {
                                    if (!result.body["@odata.context"])
                                        result.body = extend({ "@odata.context": this.odataContext }, result.body);
                                }
                                result.elementType = returnType;
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
            return new es6_promise_1.Promise((resolve, reject) => {
                let boundOpName = part.name.split(".").pop();
                let elementType = result.elementType;
                let entityBoundOp = elementType.prototype[boundOpName];
                let ctrlBoundOp = this.instance[boundOpName];
                let expOp = expCalls[boundOpName];
                let scope = this.serverType;
                let returnType = Object;
                if (entityBoundOp) {
                    scope = result.body;
                    returnType = edm_1.Edm.getReturnType(elementType, boundOpName);
                    this.__applyParams(elementType, boundOpName, part.params);
                }
                else if (ctrlBoundOp) {
                    scope = this.instance;
                    returnType = edm_1.Edm.getReturnType(this.ctrl, boundOpName);
                    this.__applyParams(this.ctrl, boundOpName, part.params);
                }
                else if (expOp)
                    scope = result;
                let boundOp = entityBoundOp || ctrlBoundOp || expOp;
                try {
                    let opResult = fnCaller.call(scope, boundOp, part.params);
                    return result_1.ODataResult.Ok(opResult).then((result) => {
                        if (isStream(result.body)) {
                            result.body.on("end", resolve);
                            result.body.on("error", reject);
                        }
                        else {
                            if (typeof result.body == "object" && result.body) {
                                if (!result.body["@odata.context"])
                                    result.body = extend({ "@odata.context": this.odataContext }, result.body);
                            }
                            if (boundOpName in expCalls) {
                                result.body = result.body.value;
                            }
                            else
                                result.elementType = returnType;
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
    __applyParams(container, name, params, queryString) {
        let queryParam, filterParam, contextParam, streamParam;
        queryParam = odata_1.odata.getQueryParameter(container, name);
        filterParam = odata_1.odata.getFilterParameter(container, name);
        contextParam = odata_1.odata.getContextParameter(container, name);
        streamParam = odata_1.odata.getStreamParameter(container, name);
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
    }
    execute(body) {
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
class ODataServer {
    static requestHandler() {
        return (req, res, next) => {
            try {
                res.setHeader("OData-Version", "4.0");
                res.contentType("application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
                let processor = this.createProcessor({
                    url: req.url,
                    method: req.method,
                    protocol: req.secure ? "https" : "http",
                    host: req.headers.host,
                    base: req.baseUrl,
                    request: req,
                    response: res
                });
                processor.pipe(res);
                processor.execute(req.body).then((result) => {
                    res.status(result.statusCode);
                    res.send(typeof result.body == "object" ? result.body : "" + result.body);
                }, next);
            }
            catch (err) {
                next(err);
            }
        };
    }
    static createProcessor(context) {
        return new ODataProcessor(context, this);
    }
    static $metadata() {
        return this._metadataCache || (this._metadataCache = odata_v4_service_metadata_1.ServiceMetadata.processMetadataJson(metadata_1.createMetadataJSON(this)));
    }
    static document() {
        return odata_v4_service_document_1.ServiceDocument.processEdmx(this.$metadata().edmx);
    }
    static addController(controller, entitySetName, elementType) {
        odata_1.odata.controller(controller, entitySetName, elementType)(this);
    }
    static getController(elementType) {
        for (let i in this.prototype) {
            if (this.prototype[i].prototype instanceof controller_1.ODataController &&
                this.prototype[i].prototype.elementType == elementType) {
                return this.prototype[i];
            }
        }
        return null;
    }
    static create(path, port, hostname) {
        let server = this;
        let router = express.Router();
        router.use(bodyParser.json());
        if (server.cors)
            router.use(cors());
        router.get("/", server.document().requestHandler());
        router.get("/\\$metadata", server.$metadata().requestHandler());
        router.use(server.requestHandler());
        router.use(ODataErrorHandler);
        if (typeof path == "number") {
            if (typeof port == "string") {
                hostname = "" + port;
            }
            port = parseInt(path, 10);
            path = undefined;
        }
        if (typeof port == "number") {
            let app = express();
            app.use(path || "/", router);
            app.listen(port, hostname);
        }
        return router;
    }
}
exports.ODataServer = ODataServer;
function ODataErrorHandler(err, req, res, next) {
    if (err) {
        console.log(err);
        res.status(err.statusCode || 500);
        res.send({
            error: err.message,
            stack: err.stack
        });
    }
    else
        next();
}
exports.ODataErrorHandler = ODataErrorHandler;
function createODataServer(server, path, port, hostname) {
    return server.create(path, port, hostname);
}
exports.createODataServer = createODataServer;
//# sourceMappingURL=server.js.map