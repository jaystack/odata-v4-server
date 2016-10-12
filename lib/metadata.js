"use strict";
const extend = require("extend");
const controller_1 = require("./controller");
const edm_1 = require("./edm");
const odata_1 = require("./odata");
const utils_1 = require("./utils");
function createMetadataJSON(server) {
    if (!server.namespace)
        server.namespace = "Default";
    let definition = {
        version: "4.0",
        dataServices: {
            schema: [{
                    namespace: server.namespace,
                    entityType: [],
                    complexType: [],
                    action: [],
                    function: [],
                    entityContainer: {
                        name: server.containerName || "Default",
                        entitySet: [],
                        actionImport: [],
                        functionImport: []
                    },
                    annotations: []
                }]
        }
    };
    let getAllOperations = function (target) {
        let ops = edm_1.Edm.getOperations(target);
        let ret = {};
        ops.forEach(op => ret[op] = target);
        target = Object.getPrototypeOf(target.prototype);
        if (target instanceof controller_1.ODataController)
            ret = extend(getAllOperations(target.constructor), ret);
        return ret;
    };
    let propNames = utils_1.getAllPropertyNames(server.prototype).filter(it => it != "constructor");
    let entitySets = odata_1.odata.getPublicControllers(server);
    propNames.forEach((i) => {
        if (i != "$metadata" && server.prototype[i]) {
            let containerSchema = definition.dataServices.schema.filter((schema) => schema.namespace == server.namespace)[0];
            if (server.prototype[i].prototype instanceof controller_1.ODataController) {
                let ctrl = server.prototype[i];
                if (!ctrl.namespace)
                    ctrl.constructor.namespace = server.namespace;
                let elementType = ctrl.prototype.elementType;
                for (var es in entitySets) {
                    if (entitySets[es] == ctrl) {
                        containerSchema.entityContainer.entitySet.push({
                            name: es,
                            entityType: (elementType.namespace || server.namespace) + "." + elementType.name
                        });
                    }
                }
                let resolvingTypes = [];
                let resolveType = (elementType, parent) => {
                    if (resolvingTypes.indexOf(elementType) >= 0)
                        return null;
                    resolvingTypes.push(elementType);
                    if (!elementType.namespace)
                        elementType.namespace = parent.namespace;
                    let typeDefinition = {
                        name: elementType.name,
                        key: [],
                        property: [],
                        navigationProperty: [],
                        annotation: edm_1.Edm.getAnnotations(elementType),
                        openType: edm_1.Edm.isOpenType(elementType),
                        hasStream: edm_1.Edm.isMediaEntity(elementType)
                    };
                    let namespace = elementType.namespace || parent.namespace || server.namespace;
                    let typeSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
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
                    let properties = edm_1.Edm.getProperties(elementType.prototype);
                    properties.forEach((prop) => {
                        let propertyDefinition = {
                            name: prop,
                            type: edm_1.Edm.getTypeName(elementType, prop),
                            nullable: edm_1.Edm.isNullable(elementType, prop),
                            annotation: edm_1.Edm.getAnnotations(elementType, prop),
                            partner: edm_1.Edm.getPartner(elementType, prop)
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
                        let type = edm_1.Edm.getType(elementType, prop);
                        if (typeof type == "function") {
                            let definitionContainer = edm_1.Edm.isComplexType(elementType, prop) ? "complexType" : "entityType";
                            let resolvedType = resolveType(type, elementType);
                            if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]) {
                                resolvedType.schema[definitionContainer].push(resolvedType.definition);
                            }
                            if (definitionContainer == "entityType") {
                                typeDefinition.navigationProperty.push(propertyDefinition);
                                return;
                            }
                        }
                        typeDefinition.property.push(propertyDefinition);
                    });
                    let operations = getAllOperations(elementType);
                    Object.keys(operations).forEach((operation) => {
                        let namespace = operations[operation].prototype[operation].namespace || elementType.namespace || parent.namespace || server.namespace;
                        let elementTypeNamespace = elementType.namespace || parent.namespace || server.namespace;
                        let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
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
                        if (edm_1.Edm.isFunction(operations[operation], operation)) {
                            let returnType = edm_1.Edm.getReturnTypeName(operations[operation], operation);
                            let parameters = edm_1.Edm.getParameters(operations[operation], operation);
                            let definition = {
                                name: operation,
                                isBound: true,
                                parameter: [{
                                        name: "bindingParameter",
                                        type: elementTypeNamespace + "." + elementType.name
                                    }].concat(parameters),
                                returnType: { type: returnType }
                            };
                            operationSchema.function.push(definition);
                        }
                        if (edm_1.Edm.isAction(operations[operation], operation)) {
                            let returnType = edm_1.Edm.getReturnTypeName(operations[operation], operation);
                            let parameters = edm_1.Edm.getParameters(operations[operation], operation);
                            let definition = {
                                name: operation,
                                isBound: true,
                                parameter: [{
                                        name: "bindingParameter",
                                        type: elementTypeNamespace + "." + elementType.name
                                    }].concat(parameters),
                                returnType: { type: returnType }
                            };
                            operationSchema.action.push(definition);
                        }
                    });
                    return {
                        schema: typeSchema,
                        definition: typeDefinition
                    };
                };
                let resolvedType = resolveType(elementType, server);
                if (resolvedType && !resolvedType.schema.entityType.filter(et => et.name == resolvedType.definition.name)[0]) {
                    resolvedType.schema.entityType.push(resolvedType.definition);
                }
                let operations = getAllOperations(ctrl);
                Object.keys(operations).forEach((operation) => {
                    let namespace = operations[operation].prototype[operation].namespace || elementType.namespace || server.namespace;
                    let elementTypeNamespace = elementType.namespace || server.namespace;
                    let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
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
                    if (edm_1.Edm.isFunction(operations[operation], operation)) {
                        let returnType = edm_1.Edm.getReturnTypeName(operations[operation], operation);
                        let parameters = edm_1.Edm.getParameters(operations[operation], operation);
                        operationSchema.function.push({
                            name: operation,
                            isBound: true,
                            parameter: [{
                                    name: "bindingParameter",
                                    type: "Collection(" + elementTypeNamespace + "." + ctrl.prototype.elementType.name + ")"
                                }].concat(parameters),
                            returnType: { type: returnType }
                        });
                    }
                    if (edm_1.Edm.isAction(operations[operation], operation)) {
                        let returnType = edm_1.Edm.getReturnTypeName(operations[operation], operation);
                        let parameters = edm_1.Edm.getParameters(operations[operation], operation);
                        operationSchema.action.push({
                            name: operation,
                            isBound: true,
                            parameter: [{
                                    name: "bindingParameter",
                                    type: "Collection(" + elementTypeNamespace + "." + ctrl.prototype.elementType.name + ")"
                                }].concat(parameters),
                            returnType: { type: returnType }
                        });
                    }
                });
            }
        }
    });
    propNames.forEach((i) => {
        if (i != "$metadata" && server.prototype[i]) {
            let containerSchema = definition.dataServices.schema.filter((schema) => schema.namespace == server.namespace)[0];
            let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == (server.prototype[i].namespace || server.namespace))[0];
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
                let returnType = edm_1.Edm.getReturnTypeName(server, i);
                let parameters = edm_1.Edm.getParameters(server, i);
                operationSchema.action.push({
                    name: i,
                    isBound: false,
                    parameter: parameters,
                    returnType: { type: returnType }
                });
                containerSchema.entityContainer.actionImport.push({
                    name: i,
                    action: (server.prototype[i].namespace || server.namespace) + "." + i
                });
            }
            if (edm_1.Edm.isFunctionImport(server, i)) {
                let returnType = edm_1.Edm.getReturnTypeName(server, i);
                let parameters = edm_1.Edm.getParameters(server, i);
                operationSchema.function.push({
                    name: i,
                    isBound: false,
                    parameter: parameters,
                    returnType: { type: returnType }
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