"use strict";
const odata_v4_resource_1 = require("odata-v4-resource");
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
const utils_1 = require("./utils");
const result_1 = require("./result");
const controller_1 = require("./controller");
const edm_1 = require("./edm");
const odata_1 = require("./odata");
const error_1 = require("./error");
const metadata_1 = require("./metadata");
const getODataContext = function (result, context, baseResource, resourcePath) {
    return (context.protocol || "http") + "://" + (context.host || "localhost") + (context.base || "") + "/$metadata#" + (baseResource.name || "");
};
const extendODataContext = function (result, context, baseResource, resourcePath) {
    if (baseResource.type == lexer_1.TokenType.EntityCollectionNavigationProperty) {
        let context = "/" + baseResource.name;
        if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1)
            return context + "/$entity";
        if (baseResource.key) {
            let type = result.elementType;
            let keys = edm_1.Edm.getKeyProperties(type);
            context += "(" + keys.map(key => edm_1.Edm.escape(result.body[key], edm_1.Edm.getTypeName(type.constructor, key))).join(",") + ")";
        }
        return context;
    }
    if (baseResource.type == lexer_1.TokenType.EntityNavigationProperty) {
        return "/" + baseResource.name;
    }
    if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1)
        return "/$entity";
    if (baseResource.key) {
        let type = result.elementType;
        let keys = edm_1.Edm.getKeyProperties(type);
        return "(" + keys.map(key => edm_1.Edm.escape(result.body[key], edm_1.Edm.getTypeName(type.constructor, key))).join(",") + ")";
    }
    if (baseResource.type == lexer_1.TokenType.PrimitiveProperty)
        return "/" + baseResource.name;
    return "";
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
class ODataProcessor {
    constructor(context, server) {
        this.context = context;
        this.serverType = server;
        let method = this.method = context.method.toLowerCase();
        if (ODataRequestMethods.indexOf(method) < 0)
            throw new error_1.MethodNotAllowedError();
        this.url = url.parse(context.url);
        let pathname = this.url.pathname;
        let resourcePath = this.resourcePath = odata_v4_resource_1.createServiceOperationCall(pathname, this.serverType.$metadata().edmx);
        let entitySets = this.entitySets = odata_1.odata.getPublicControllers(this.serverType);
        this.workflow = [];
        if (resourcePath.navigation.length > 0) {
            this.workflow = resourcePath.navigation.map((part) => {
                let fn = this["__" + part.type];
                if (fn)
                    return fn.call(this, part);
                console.log(`Unhandled navigation type: ${part.type}`);
            }).filter(it => !!it);
            if (resourcePath.call)
                this.workflow.push(this.__actionOrFunction(resourcePath.call, resourcePath.params));
        }
        else {
            if (resourcePath.call)
                this.workflow = [this.__actionOrFunctionImport(resourcePath.call, resourcePath.params)];
        }
    }
    __EntityCollectionNavigationProperty(part) {
        return (result) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                let resultType = result.elementType;
                let elementType = edm_1.Edm.getType(resultType, part.name);
                let ctrl = this.serverType.getController(elementType);
                let foreignKeys = edm_1.Edm.getForeignKeys(resultType, part.name);
                let typeKeys = edm_1.Edm.getKeyProperties(resultType);
                let foreignFilter = foreignKeys.map((key) => {
                    return `${key} eq ${edm_1.Edm.escape(result.body[typeKeys[0]], edm_1.Edm.getTypeName(elementType, key))}`;
                }).join(" AND ");
                let params = {};
                if (part.key)
                    part.key.forEach((key) => params[key.name] = key.value);
                this.__read(ctrl, part, params, null, foreignFilter).then((foreignResult) => {
                    foreignResult.body["@odata.context"] = result.body["@odata.context"] + extendODataContext(foreignResult, this.context, part, this.resourcePath);
                    resolve(foreignResult);
                }, reject);
            });
        };
    }
    __EntityNavigationProperty(part) {
        return (result) => {
            return new es6_promise_1.Promise((resolve, reject) => {
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
                this.__read(ctrl, part, params).then((foreignResult) => {
                    foreignResult.body["@odata.context"] = result.body["@odata.context"] + extendODataContext(foreignResult, this.context, part, this.resourcePath);
                    resolve(foreignResult);
                }, reject);
            });
        };
    }
    __PrimitiveProperty(part) {
        return (result) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                result.body["@odata.context"] += extendODataContext(result, this.context, part, this.resourcePath);
                result.body = {
                    "@odata.context": result.body["@odata.context"],
                    value: result.body[part.name]
                };
                resolve(result);
            });
        };
    }
    __read(ctrl, part, params, data, filter) {
        return new es6_promise_1.Promise((resolve, reject) => {
            this.ctrl = ctrl;
            let fn = odata_1.odata.findODataMethod(ctrl, this.method, part.key);
            if (!fn)
                return reject(new error_1.ResourceNotFoundError());
            let queryParam, filterParam, contextParam;
            if (typeof fn != "function") {
                let fnDesc = fn;
                queryParam = odata_1.odata.getQueryParameter(ctrl, fnDesc.call);
                filterParam = odata_1.odata.getFilterParameter(ctrl, fnDesc.call);
                contextParam = odata_1.odata.getContextParameter(ctrl, fnDesc.call);
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
            else {
                queryParam = odata_1.odata.getQueryParameter(ctrl, this.method);
                filterParam = odata_1.odata.getFilterParameter(ctrl, this.method);
                contextParam = odata_1.odata.getContextParameter(ctrl, this.method);
            }
            let queryString = filter ? `$filter=${filter}` : this.url.query;
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
            if (!(currentResult instanceof es6_promise_1.Promise)) {
                currentResult = new es6_promise_1.Promise((resolve) => {
                    resolve(currentResult);
                });
            }
            currentResult.then((result) => {
                if (!(result instanceof result_1.ODataResult)) {
                    return ODataRequestResult[this.method](result).then((result) => {
                        if (typeof result.body == "object" && result.body) {
                            if (!result.body["@odata.context"])
                                result.body = extend({ "@odata.context": getODataContext(result.body, this.context, part, this.resourcePath) }, result.body);
                            result.body["@odata.context"] += extendODataContext(result, this.context, part, this.resourcePath);
                        }
                        return result;
                    }, reject);
                }
                if (typeof result.body == "object" && result.body) {
                    if (!result.body["@odata.context"])
                        result.body = extend({ "@odata.context": getODataContext(result.body, this.context, part, this.resourcePath) }, result.body);
                    result.body["@odata.context"] += extendODataContext(result, this.context, part, this.resourcePath);
                }
                return result;
            }).then(resolve, reject);
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
    __actionOrFunctionImport(call, params) {
        let fn = this.serverType.prototype[call];
        return (data) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                try {
                    let result = fnCaller.call(data, fn, params);
                    if (edm_1.Edm.isActionImport(this.serverType, call)) {
                        return result_1.ODataResult.NoContent(result).then(resolve, reject);
                    }
                    else if (edm_1.Edm.isFunctionImport(this.serverType, call)) {
                        return result_1.ODataResult.Ok(result).then((result) => {
                            if (typeof result.body == "object" && result.body) {
                                if (!result.body["@odata.context"])
                                    result.body["@odata.context"] = getODataContext(result.body, this.context, {
                                        name: edm_1.Edm.getReturnType(this.serverType, call)
                                    }, this.resourcePath);
                            }
                            resolve(result);
                        }, reject);
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        };
    }
    __actionOrFunction(call, params) {
        return (result) => {
            return new es6_promise_1.Promise((resolve, reject) => {
                let boundOpName = call.split(".").pop();
                let boundOp = this.ctrl ? this.ctrl[boundOpName] || expCalls[boundOpName] : expCalls[boundOpName];
                try {
                    let opResult = fnCaller.call(boundOpName in expCalls ? result : this.ctrl, boundOp, params);
                    return result_1.ODataResult.Ok(opResult).then((result) => {
                        if (typeof result.body == "object" && result.body) {
                            if (!result.body["@odata.context"])
                                result.body["@odata.context"] = getODataContext(result.body, this.context, {
                                    name: edm_1.Edm.getReturnType(this.ctrl, boundOpName)
                                }, this.resourcePath);
                        }
                        resolve(result);
                    }, reject);
                }
                catch (err) {
                    reject(err);
                }
            });
        };
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
                this.createProcessor({
                    url: req.url,
                    method: req.method,
                    protocol: req.secure ? "https" : "http",
                    host: req.headers.host,
                    base: req.baseUrl,
                    request: req,
                    response: res
                }).execute(req.body).then((result) => {
                    res.status(result.statusCode);
                    res.setHeader("OData-Version", "4.0");
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
    let router = express.Router();
    router.use(bodyParser.json());
    if (server.cors)
        router.use(cors());
    router.get('/', server.document().requestHandler());
    router.get('/\\$metadata', server.$metadata().requestHandler());
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
exports.createODataServer = createODataServer;
//# sourceMappingURL=server.js.map