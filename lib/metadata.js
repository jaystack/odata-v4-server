"use strict";
var extend = require("extend");
var controller_1 = require("./controller");
var edm_1 = require("./edm");
function createMetadataJSON(server) {
    var definition = {
        version: "4.0",
        dataServices: {
            schema: [{
                    namespace: server.namespace,
                    entityType: [],
                    complexType: [],
                    action: [],
                    function: [],
                    entityContainer: {
                        name: server.containerName,
                        entitySet: [],
                        actionImport: [],
                        functionImport: []
                    },
                    annotations: []
                }]
        }
    };
    var getAllPropertyNames = function (proto) {
        var propNames = Object.getOwnPropertyNames(proto);
        proto = Object.getPrototypeOf(proto);
        if (proto !== Object.prototype)
            propNames = propNames.concat(getAllPropertyNames(proto));
        return propNames;
    };
    var getAllOperations = function (target) {
        var ops = edm_1.Edm.getOperations(target);
        var ret = {};
        ops.forEach(function (op) { return ret[op] = target; });
        target = Object.getPrototypeOf(target.prototype);
        if (target instanceof controller_1.ODataController)
            ret = extend(getAllOperations(target.constructor), ret);
        return ret;
    };
    var propNames = getAllPropertyNames(server.prototype).filter(function (it) { return it != "constructor"; });
    propNames.forEach(function (i) {
        if (i != "$metadata" && server.prototype[i]) {
            var containerSchema = definition.dataServices.schema.filter(function (schema) { return schema.namespace == server.namespace; })[0];
            if (server.prototype[i].prototype instanceof controller_1.ODataController) {
                var ctrl_1 = server.prototype[i];
                var elementType_1 = ctrl_1.prototype.elementType;
                containerSchema.entityContainer.entitySet.push({
                    name: ctrl_1.prototype.collectionName,
                    entityType: (elementType_1.namespace || server.namespace) + "." + elementType_1.name
                });
                var resolveType_1 = function (elementType, parent) {
                    var typeDefinition = {
                        name: elementType.name,
                        key: [],
                        property: [],
                        annotation: edm_1.Edm.getAnnotations(elementType)
                    };
                    var namespace = elementType.namespace || parent.namespace || server.namespace;
                    var typeSchema = definition.dataServices.schema.filter(function (schema) { return schema.namespace == namespace; })[0];
                    if (!typeSchema) {
                        typeSchema = {
                            namespace: namespace,
                            entityType: [],
                            complexType: [],
                            action: [],
                            function: [],
                            annotations: []
                        };
                        definition.dataServices.schema.unshift(typeSchema);
                    }
                    var properties = edm_1.Edm.getProperties(elementType.prototype);
                    properties.forEach(function (prop) {
                        var propertyDefinition = {
                            name: prop,
                            type: edm_1.Edm.getTypeName(elementType, prop),
                            nullable: edm_1.Edm.isNullable(elementType, prop),
                            annotation: edm_1.Edm.getAnnotations(elementType, prop)
                        };
                        if (edm_1.Edm.isKey(elementType, prop)) {
                            typeDefinition.key.push({
                                propertyRef: [{
                                        name: prop
                                    }]
                            });
                        }
                        if (edm_1.Edm.isComputed(elementType, prop)) {
                            propertyDefinition.annotation.unshift({
                                term: "Org.OData.Core.V1.Computed",
                                bool: true
                            });
                        }
                        typeDefinition.property.push(propertyDefinition);
                        var type = edm_1.Edm.getType(elementType, prop);
                        if (typeof type == "function") {
                            var definitionContainer = edm_1.Edm.isComplexType(elementType, prop) ? "complexType" : "entityType";
                            var resolvedType_1 = resolveType_1(type, elementType);
                            if (!resolvedType_1.schema[definitionContainer].filter(function (et) { return et.name == resolvedType_1.definition.name; })[0]) {
                                resolvedType_1.schema[definitionContainer].push(resolvedType_1.definition);
                            }
                        }
                    });
                    return {
                        schema: typeSchema,
                        definition: typeDefinition
                    };
                };
                var resolvedType_2 = resolveType_1(elementType_1, server);
                if (!resolvedType_2.schema.entityType.filter(function (et) { return et.name == resolvedType_2.definition.name; })[0]) {
                    resolvedType_2.schema.entityType.push(resolvedType_2.definition);
                }
                var operations_1 = getAllOperations(ctrl_1);
                Object.keys(operations_1).forEach(function (operation) {
                    var namespace = operations_1[operation].prototype[operation].namespace || elementType_1.namespace || server.namespace;
                    var elementTypeNamespace = elementType_1.namespace || server.namespace;
                    var operationSchema = definition.dataServices.schema.filter(function (schema) { return schema.namespace == namespace; })[0];
                    if (!operationSchema) {
                        operationSchema = {
                            namespace: namespace,
                            entityType: [],
                            complexType: [],
                            action: [],
                            function: [],
                            annotations: []
                        };
                        definition.dataServices.schema.unshift(operationSchema);
                    }
                    if (edm_1.Edm.isFunction(operations_1[operation], operation)) {
                        var returnType = edm_1.Edm.getReturnType(operations_1[operation], operation);
                        var parameters = edm_1.Edm.getParameters(operations_1[operation], operation);
                        operationSchema.function.push({
                            name: operation,
                            isBound: true,
                            parameter: [{
                                    name: "bindingParameter",
                                    type: "Collection(" + elementTypeNamespace + "." + ctrl_1.prototype.elementType.name + ")"
                                }].concat(parameters),
                            returnType: returnType
                        });
                    }
                    if (edm_1.Edm.isAction(operations_1[operation], operation)) {
                        var returnType = edm_1.Edm.getReturnType(operations_1[operation], operation);
                        var parameters = edm_1.Edm.getParameters(operations_1[operation], operation);
                        operationSchema.function.push({
                            name: operation,
                            isBound: true,
                            parameter: [{
                                    name: "bindingParameter",
                                    type: "Collection(" + elementTypeNamespace + "." + ctrl_1.prototype.elementType.name + ")"
                                }].concat(parameters),
                            returnType: returnType
                        });
                    }
                });
            }
            var operationSchema = definition.dataServices.schema.filter(function (schema) { return schema.namespace == (server.prototype[i].namespace || server.namespace); })[0];
            if (!operationSchema) {
                operationSchema = {
                    namespace: server.prototype[i].namespace,
                    entityType: [],
                    complexType: [],
                    action: [],
                    function: [],
                    annotations: []
                };
                definition.dataServices.schema.unshift(operationSchema);
            }
            if (edm_1.Edm.isActionImport(server, i)) {
                var returnType = edm_1.Edm.getReturnType(server, i);
                var parameters = edm_1.Edm.getParameters(server, i);
                operationSchema.action.push({
                    name: i,
                    isBound: false,
                    parameter: parameters,
                    returnType: returnType
                });
                containerSchema.entityContainer.actionImport.push({
                    name: i,
                    action: (server.prototype[i].namespace || server.namespace) + "." + i
                });
            }
            if (edm_1.Edm.isFunctionImport(server, i)) {
                var returnType = edm_1.Edm.getReturnType(server, i);
                var parameters = edm_1.Edm.getParameters(server, i);
                operationSchema.function.push({
                    name: i,
                    isBound: false,
                    parameter: parameters,
                    returnType: returnType
                });
                containerSchema.entityContainer.functionImport.push({
                    name: i,
                    function: (server.prototype[i].namespace || server.namespace) + "." + i
                });
            }
        }
    });
    return definition;
}
exports.createMetadataJSON = createMetadataJSON;
//# sourceMappingURL=metadata.js.map