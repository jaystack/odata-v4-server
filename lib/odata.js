"use strict";
var odata;
(function (odata) {
    function type(elementType) {
        return function (constructor) {
            constructor.prototype.elementType = elementType;
        };
    }
    odata.type = type;
    function context(collectionName) {
        return function (constructor) {
            constructor.prototype.collectionName = collectionName;
        };
    }
    odata.context = context;
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
    function controller(controller) {
        return function (server) {
            server.prototype[controller.prototype.collectionName] = controller;
        };
    }
    odata.controller = controller;
    function config(configuration) {
        return function (server) {
            server.prototype.configuration = configuration;
        };
    }
    odata.config = config;
    function cors() {
        return function (server) {
            server.cors = true;
        };
    }
    odata.cors = cors;
})(odata = exports.odata || (exports.odata = {}));
//# sourceMappingURL=odata.js.map