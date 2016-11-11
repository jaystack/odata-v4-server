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
    const ODataLinkParameters = "odata:linkparameters";
    const ODataQueryParameter = "odata:queryparameter";
    const ODataFilterParameter = "odata:filterparameter";
    const ODataBodyParameter = "odata:bodyparameter";
    const ODataContextParameter = "odata:contextparameter";
    const ODataStreamParameter = "odata:streamparameter";
    const ODataResultParameter = "odata:resultparameter";
    const ODataIdParameter = "odata:idparameter";
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
    function odataMethodFactory(type, navigationProperty) {
        type = type.toLowerCase();
        let decorator = function (target, targetKey) {
            let existingMethods = Reflect.getMetadata(ODataMethod, target, targetKey) || [];
            existingMethods.push(type);
            Reflect.defineMetadata(ODataMethod, existingMethods, target, targetKey);
            return decorator;
        };
        let fn = function (target, targetKey) {
            if (arguments.length == 0)
                return decorator;
            else
                return decorator(target, targetKey);
        };
        if (typeof navigationProperty == "string") {
            type += "/" + navigationProperty;
            fn.$ref = decorator.$ref = function (target, targetKey) {
                type += "/$ref";
                let existingMethods = Reflect.getMetadata(ODataMethod, target, targetKey) || [];
                existingMethods.push(type);
                Reflect.defineMetadata(ODataMethod, existingMethods, target, targetKey);
            };
        }
        return fn;
    }
    function GET(target, targetKey) {
        if (typeof target == "string" || typeof target == "undefined")
            return odataMethodFactory("GET", target);
        odataMethodFactory("GET", target)(target, targetKey);
    }
    odata.GET = GET;
    function POST(target, targetKey) {
        if (typeof target == "string" || typeof target == "undefined")
            return odataMethodFactory("POST", target);
        odataMethodFactory("POST", target)(target, targetKey);
    }
    odata.POST = POST;
    function PUT(target, targetKey) {
        if (typeof target == "string" || typeof target == "undefined")
            return odataMethodFactory("PUT", target);
        odataMethodFactory("PUT", target)(target, targetKey);
    }
    odata.PUT = PUT;
    function PATCH(target, targetKey) {
        if (typeof target == "string" || typeof target == "undefined")
            return odataMethodFactory("PATCH", target);
        odataMethodFactory("PATCH", target)(target, targetKey);
    }
    odata.PATCH = PATCH;
    function DELETE(target, targetKey) {
        if (typeof target == "string" || typeof target == "undefined")
            return odataMethodFactory("DELETE", target);
        odataMethodFactory("DELETE", target)(target, targetKey);
    }
    odata.DELETE = DELETE;
    function createRef(navigationProperty) {
        return POST(navigationProperty).$ref;
    }
    odata.createRef = createRef;
    function updateRef(navigationProperty) {
        return PUT(navigationProperty).$ref;
    }
    odata.updateRef = updateRef;
    function deleteRef(navigationProperty) {
        return DELETE(navigationProperty).$ref;
    }
    odata.deleteRef = deleteRef;
    /** Annotate function for a specified OData method operation */
    function method(method, navigationProperty) {
        return odataMethodFactory(method.toUpperCase(), navigationProperty);
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
    function link(target, targetKey, parameterIndex) {
        let name;
        let decorator = function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let existingParameters = Reflect.getOwnMetadata(ODataLinkParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            existingParameters.push({
                from: name || paramName,
                to: paramName
            });
            Reflect.defineMetadata(ODataLinkParameters, existingParameters, target, targetKey);
        };
        if (typeof target == "string" || typeof target == "undefined" || !target) {
            name = target;
            return decorator;
        }
        else
            return decorator(target, targetKey, parameterIndex);
    }
    odata.link = link;
    function getLinks(target, targetKey) {
        return Reflect.getMetadata(ODataLinkParameters, target.prototype, targetKey) || [];
    }
    odata.getLinks = getLinks;
    function findODataMethod(target, method, keys) {
        keys = keys || [];
        let propNames = utils_1.getAllPropertyNames(target.prototype);
        for (let prop of propNames) {
            if (odata.getMethod(target, prop) && odata.getMethod(target, prop).indexOf(method) >= 0) {
                let fnKeys = odata.getKeys(target, prop);
                if (keys.length == fnKeys.length) {
                    return {
                        call: prop,
                        key: fnKeys,
                        link: odata.getLinks(target, prop)
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
                        key: fnKeys,
                        link: odata.getLinks(target, prop)
                    };
                }
            }
        }
        for (let prop of propNames) {
            if (odata.getMethod(target, prop) && odata.getMethod(target, prop).indexOf(method) >= 0) {
                return {
                    call: prop,
                    key: [],
                    link: odata.getLinks(target, prop)
                };
            }
        }
        for (let prop of propNames) {
            if (prop == method.toLowerCase()) {
                return {
                    call: prop,
                    key: [],
                    link: odata.getLinks(target, prop)
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
    odata.id = (function id() {
        return function (target, targetKey, parameterIndex) {
            let parameterNames = utils_1.getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataIdParameter, paramName, target, targetKey);
        };
    })();
    function getIdParameter(target, targetKey) {
        return Reflect.getMetadata(ODataIdParameter, target.prototype, targetKey);
    }
    odata.getIdParameter = getIdParameter;
})(odata = exports.odata || (exports.odata = {}));
//# sourceMappingURL=odata.js.map