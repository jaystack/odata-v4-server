"use strict";
var odata_v4_resource_1 = require("odata-v4-resource");
var odata_v4_service_metadata_1 = require("odata-v4-service-metadata");
var odata_v4_service_document_1 = require("odata-v4-service-document");
var lexer_1 = require("odata-v4-parser/lib/lexer");
var extend = require("extend");
var es6_promise_1 = require("es6-promise");
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var utils_1 = require("./utils");
var result_1 = require("./result");
var edm_1 = require("./edm");
var error_1 = require("./error");
var metadata_1 = require("./metadata");
var getODataContext = function (result, req, baseResource, resourcePath) {
    return (req.secure ? "https" : "http") + "://" + req.headers.host + req.baseUrl + "/$metadata#" + baseResource.name;
};
var extendODataContext = function (result, req, baseResource, resourcePath) {
    if (baseResource.key && resourcePath.navigation.length == 0)
        return "/$entity";
    if (baseResource.key) {
        var type_1 = Object.getPrototypeOf(result);
        var keys = edm_1.Edm.getKeyProperties(type_1);
        return "(" + keys.map(function (key) { return edm_1.Edm.escape(result[key], edm_1.Edm.getTypeName(type_1.constructor, key)); }).join(",") + ")";
    }
    if (baseResource.type == lexer_1.TokenType.PrimitiveProperty)
        return "/" + baseResource.name;
    return "";
};
var fnCaller = function (fn, body, params) {
    if (!params && body) {
        params = body;
        body = undefined;
    }
    params = params || {};
    var fnParams;
    var paramsArray = Object.keys(params);
    fnParams = utils_1.getFunctionParameters(fn);
    for (var i = 0; i < fnParams.length; i++) {
        fnParams[i] = params[fnParams[i]];
    }
    fnParams = fnParams.concat(paramsArray.map(function (key) { return { name: key, value: params[key] }; }));
    fnParams = fnParams.filter(function (it) { return typeof it != "undefined"; });
    if (body) {
        fnParams.unshift(body);
    }
    return fn.apply(this, fnParams);
};
var sortObject = function (o) {
    return Object.keys(o).sort().reduce(function (r, k) { return (r[k] = o[k], r); }, {});
};
var ODataRequestMethods = ["get", "post", "put", "patch", "delete"];
var ODataRequestResult = {
    get: result_1.ODataResult.Ok,
    post: result_1.ODataResult.Created,
    put: result_1.ODataResult.NoContent,
    patch: result_1.ODataResult.NoContent,
    delete: result_1.ODataResult.NoContent
};
var expCalls = {
    $count: function () {
        return this.length;
    },
    $value: function () {
        return this;
    }
};
var ODataServer = (function () {
    function ODataServer(configuration) {
        this.configuration = extend(this.configuration || {}, configuration || {});
    }
    ODataServer.requestHandler = function (configuration) {
        var server = new this(configuration);
        var serverType = this;
        var $metadata = this.$metadata();
        return function (req, res, next) {
            var method = req.method.toLowerCase();
            if (ODataRequestMethods.indexOf(method) < 0)
                return next();
            var responseHandler = function (result, baseResource, resourcePath, instance) {
                if (typeof result.body == "object") {
                    if (!result.body["@odata.context"])
                        result.body["@odata.context"] = getODataContext(result.body, req, baseResource, resourcePath);
                    if (baseResource.type == lexer_1.TokenType.PrimitiveProperty) {
                        result.body["@odata.context"] += extendODataContext(result.body, req, baseResource, resourcePath);
                        result.body = {
                            "@odata.context": result.body["@odata.context"],
                            value: result.body[baseResource.name]
                        };
                    }
                }
                if (resourcePath && resourcePath.call) {
                    var boundOpName_1 = resourcePath.call.split(".").pop();
                    var boundOp = instance ? instance[boundOpName_1] || expCalls[boundOpName_1] : expCalls[boundOpName_1];
                    try {
                        var opResult = fnCaller.call(result.body.value, boundOp, resourcePath.params);
                        result_1.ODataResult.Ok(opResult).then(function (result) {
                            responseHandler(result, instance ? {
                                name: edm_1.Edm.getReturnType(instance.constructor, boundOpName_1)
                            } : null);
                        }, next);
                    }
                    catch (err) {
                        next(err);
                    }
                }
                else {
                    res.status(result.statusCode);
                    res.setHeader("OData-Version", "4.0");
                    if (result.body) {
                        if (typeof result.body == "object")
                            res.send(sortObject(result.body));
                        else
                            res.send("" + result.body);
                    }
                    else
                        res.end();
                }
            };
            var resourcePath = odata_v4_resource_1.createServiceOperationCall(req.url, $metadata.edmx);
            var navigationHandler = function (baseResource, result) {
                if (!baseResource) {
                    if (resourcePath.call) {
                        var fn = server[resourcePath.call];
                        try {
                            var result_2 = fnCaller.call(server, fn, resourcePath.params);
                            if (edm_1.Edm.isActionImport(serverType, resourcePath.call)) {
                                result_1.ODataResult.NoContent(result_2).then(responseHandler, next);
                            }
                            else if (edm_1.Edm.isFunctionImport(serverType, resourcePath.call)) {
                                result_1.ODataResult.Ok(result_2).then(function (result) {
                                    responseHandler(result, {
                                        name: edm_1.Edm.getReturnType(serverType, resourcePath.call)
                                    });
                                }, next);
                            }
                        }
                        catch (err) {
                            next(err);
                        }
                    }
                    else
                        return next(new error_1.ResourceNotFoundError());
                }
                else {
                    if (baseResource.type == lexer_1.TokenType.PrimitiveProperty) {
                        return responseHandler(result, baseResource, resourcePath);
                    }
                    var ctrl = server[baseResource.name];
                    var instance_1 = new ctrl(req, res, next, server);
                    var params_1 = {};
                    if (baseResource.key)
                        baseResource.key.forEach(function (key) { return params_1[key.name] = key.value; });
                    var fn = instance_1[method];
                    if (!fn)
                        return next(new error_1.ResourceNotFoundError());
                    var entity_1;
                    switch (method) {
                        case "get":
                        case "delete":
                            result = fnCaller.call(instance_1, fn, params_1);
                            break;
                        case "post":
                        case "put":
                            var ctr = instance_1.elementType;
                            entity_1 = new ctr(req.body);
                        case "patch":
                            if (!baseResource.key) {
                                var properties = edm_1.Edm.getProperties(instance_1.elementType.prototype);
                                properties.forEach(function (prop) {
                                    if (edm_1.Edm.isKey(instance_1.elementType, prop)) {
                                        params_1[prop] = entity_1[prop];
                                    }
                                });
                            }
                            result = fnCaller.call(instance_1, fn, entity_1 || req.body, params_1);
                            break;
                    }
                    var readyFn = function (result) {
                        if (!(result instanceof result_1.ODataResult)) {
                            return ODataRequestResult[method](result).then(function (result) {
                                if (!result.body["@odata.context"])
                                    result.body["@odata.context"] = getODataContext(result.body, req, baseResource, resourcePath);
                                result.body["@odata.context"] += extendODataContext(result.body, req, baseResource, resourcePath);
                                if (resourcePath.navigation.length > 0 || (resourcePath.call && server[resourcePath.call]))
                                    return navigationHandler(resourcePath.navigation.shift(), result);
                                return responseHandler(result, baseResource, resourcePath, instance_1);
                            }, next);
                        }
                        if (!result.body["@odata.context"])
                            result.body["@odata.context"] = getODataContext(result.body, req, baseResource, resourcePath);
                        result.body["@odata.context"] += extendODataContext(result.body, req, baseResource, resourcePath);
                        if (resourcePath.navigation.length > 0 || (resourcePath.call && server[resourcePath.call]))
                            return navigationHandler(resourcePath.navigation.shift(), result);
                        return responseHandler(result, baseResource, resourcePath, instance_1);
                    };
                    if (result instanceof es6_promise_1.Promise) {
                        var defer = result;
                        defer.then(readyFn, next);
                    }
                    else
                        readyFn(result);
                }
            };
            navigationHandler(resourcePath.navigation.shift());
        };
    };
    ODataServer.$metadata = function () {
        return this._metadataCache || (this._metadataCache = odata_v4_service_metadata_1.ServiceMetadata.processMetadataJson(metadata_1.createMetadataJSON(this)));
    };
    ODataServer.document = function () {
        return odata_v4_service_document_1.ServiceDocument.processEdmx(this.$metadata().edmx);
    };
    return ODataServer;
}());
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
    var router = express.Router();
    router.use(bodyParser.json());
    if (server.cors)
        router.use(cors());
    router.get('/', server.document().requestHandler());
    router.get('/\\$metadata', server.$metadata().requestHandler());
    router.use(server.requestHandler(server));
    router.use(ODataErrorHandler);
    if (typeof path == "number") {
        if (typeof port == "string") {
            hostname = "" + port;
        }
        port = parseInt(path, 10);
        path = undefined;
    }
    if (typeof port == "number") {
        var app = express();
        app.use(path || "/", router);
        app.listen(port, hostname);
    }
    return router;
}
exports.createODataServer = createODataServer;
//# sourceMappingURL=server.js.map