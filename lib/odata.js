"use strict";
require("reflect-metadata");
const utils_1 = require("./utils");
class ODataMethodType {
}
ODataMethodType.GET = "GET";
ODataMethodType.POST = "POST";
ODataMethodType.PUT = "PUT";
ODataMethodType.PATCH = "PATCH";
ODataMethodType.DELETE = "DELETE";
exports.ODataMethodType = ODataMethodType;
var odata;
(function (odata) {
    const ODataEntitySets = "odata:entitysets";
    const ODataMethod = "odata:method";
    const ODataKeyParameters = "odata:keyparameters";
    const ODataQueryParameter = "odata:queryparameter";
    const ODataFilterParameter = "odata:filterparameter";
    const ODataBodyParameter = "odata:bodyparameter";
    const ODataContextParameter = "odata:contextparameter";
    const ODataStreamParameter = "odata:streamparameter";
    const ODataResultParameter = "odata:resultparameter";
    function type(elementType) {
        return function (constructor) {
            constructor.prototype.elementType = elementType;
        };
    }
    odata.type = type;
    function namespace(namespace) {
        return function (target, targetKey) {
            if (targetKey)
                target[targetKey].namespace = namespace;
            else
                target.namespace = namespace;
        };
    }
    odata.namespace = namespace;
    function container(name) {
        return function (server) {
            server.containerName = name;
        };
    }
    odata.container = container;
    function controller(controller, entitySetName, elementType) {
        return function (server) {
            server.prototype[controller.name] = controller;
            entitySetName = (typeof entitySetName == "string" ? entitySetName : "") || controller.prototype.entitySetName || (entitySetName === true ? controller.name.replace("Controller", "") : false);
            if (entitySetName) {
                let entitySets = Reflect.getOwnMetadata(ODataEntitySets, server) || {};
                entitySets[entitySetName] = controller;
                Reflect.defineMetadata(ODataEntitySets, entitySets, server);
            }
            if (elementType) {
                controller.prototype.elementType = elementType;
            }
            if (!controller.prototype.elementType) {
                controller.prototype.elementType = Object;
            }
        };
    }
    odata.controller = controller;
    function getPublicControllers(server) {
        return Reflect.getOwnMetadata(ODataEntitySets, server) || {};
    }
    odata.getPublicControllers = getPublicControllers;
    odata.cors = (function cors() {
        return function (server) {
            server.cors = true;
        };
    })();
    function odataMethodFactory(type) {
        let decorator = function (target, targetKey) {
            Reflect.defineMetadata(ODataMethod, type, target, targetKey);
        };
        return function (target, targetKey) {
            if (arguments.length == 0)
                return decorator;
            else
                return decorator(target, targetKey);
        };
    }
    odata.GET = odataMethodFactory("GET");
    odata.POST = odataMethodFactory("POST");
    odata.PUT = odataMethodFactory("PUT");
    odata.PATCH = odataMethodFactory("PATCH");
    odata.DELETE = odataMethodFactory("DELETE");
    function method(method) {
        return odataMethodFactory(method.toUpperCase());
    }
    odata.method = method;
    function getMethod(target, targetKey) {
        return Reflect.getMetadata(ODataMethod, target.prototype, targetKey);
    }
    odata.getMethod = getMethod;
    function key(target, targetKey, parameterIndex) {
        let name;
        let decorator = function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let existingParameters = Reflect.getOwnMetadata(ODataKeyParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            existingParameters.push({
                from: name || paramName,
                to: paramName
            });
            Reflect.defineMetadata(ODataKeyParameters, existingParameters, target, targetKey);
        };
        if (typeof target == "string" || typeof target == "undefined" || !target) {
            name = target;
            return decorator;
        }
        else
            return decorator(target, targetKey, parameterIndex);
    }
    odata.key = key;
    function getKeys(target, targetKey) {
        return Reflect.getMetadata(ODataKeyParameters, target.prototype, targetKey) || [];
    }
    odata.getKeys = getKeys;
    function findODataMethod(target, method, keys) {
        keys = keys || [];
        let propNames = utils_1.getAllPropertyNames(target.prototype);
        for (let prop of propNames) {
            if (odata.getMethod(target, prop) == method.toUpperCase()) {
                let fnKeys = odata.getKeys(target, prop);
                if (keys.length == fnKeys.length) {
                    return {
                        call: prop,
                        key: fnKeys
                    };
                }
            }
        }
        for (let prop of propNames) {
            if (prop == method.toLowerCase()) {
                let fnKeys = odata.getKeys(target, prop);
                if (keys.length == fnKeys.length) {
                    return {
                        call: prop,
                        key: fnKeys
                    };
                }
            }
        }
        for (let prop of propNames) {
            if (odata.getMethod(target, prop) == method.toUpperCase()) {
                return {
                    call: prop,
                    key: []
                };
            }
        }
        for (let prop of propNames) {
            if (prop == method.toLowerCase()) {
                return {
                    call: prop,
                    key: []
                };
            }
        }
    }
    odata.findODataMethod = findODataMethod;
    odata.query = (function query() {
        return function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataQueryParameter, paramName, target, targetKey);
        };
    })();
    function getQueryParameter(target, targetKey) {
        return Reflect.getMetadata(ODataQueryParameter, target.prototype, targetKey);
    }
    odata.getQueryParameter = getQueryParameter;
    odata.filter = (function filter() {
        return function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataFilterParameter, paramName, target, targetKey);
        };
    })();
    function getFilterParameter(target, targetKey) {
        return Reflect.getMetadata(ODataFilterParameter, target.prototype, targetKey);
    }
    odata.getFilterParameter = getFilterParameter;
    odata.body = (function body() {
        return function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataBodyParameter, paramName, target, targetKey);
        };
    })();
    function getBodyParameter(target, targetKey) {
        return Reflect.getMetadata(ODataBodyParameter, target.prototype, targetKey);
    }
    odata.getBodyParameter = getBodyParameter;
    odata.context = (function context() {
        return function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataContextParameter, paramName, target, targetKey);
        };
    })();
    function getContextParameter(target, targetKey) {
        return Reflect.getMetadata(ODataContextParameter, target.prototype, targetKey);
    }
    odata.getContextParameter = getContextParameter;
    odata.stream = (function stream() {
        return function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataStreamParameter, paramName, target, targetKey);
        };
    })();
    function getStreamParameter(target, targetKey) {
        return Reflect.getMetadata(ODataStreamParameter, target.prototype, targetKey);
    }
    odata.getStreamParameter = getStreamParameter;
    odata.result = (function result() {
        return function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataResultParameter, paramName, target, targetKey);
        };
    })();
    function getResultParameter(target, targetKey) {
        return Reflect.getMetadata(ODataResultParameter, target.prototype, targetKey);
    }
    odata.getResultParameter = getResultParameter;
})(odata = exports.odata || (exports.odata = {}));
//# sourceMappingURL=odata.js.map