import * as extend from "extend";
import { ODataController } from "./controller";
import { ODataServer } from "./server";
import { Edm } from "./edm";

export function createMetadataJSON(server:typeof ODataServer){
    let definition:any = {
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
    let getAllPropertyNames = function(proto:any):string[]{
        let propNames = Object.getOwnPropertyNames(proto);
        proto = Object.getPrototypeOf(proto);
        if (proto !== Object.prototype) propNames = propNames.concat(getAllPropertyNames(proto));
        return propNames;
    };
    let getAllOperations = function(target:Function):any{
        let ops = Edm.getOperations(target);
        let ret = {};
        ops.forEach(op => ret[op] = target);
        target = Object.getPrototypeOf(target.prototype);
        if (target instanceof ODataController) ret = extend(getAllOperations(target.constructor), ret);
        return ret;
    };
    let propNames = getAllPropertyNames(server.prototype).filter(it => it != "constructor");
    propNames.forEach((i) => {
        if (i != "$metadata" && server.prototype[i]){
            let containerSchema = definition.dataServices.schema.filter((schema) => schema.namespace == server.namespace)[0];
            if (server.prototype[i].prototype instanceof ODataController){
                let ctrl = server.prototype[i];
                let elementType = ctrl.prototype.elementType;
                containerSchema.entityContainer.entitySet.push({
                    name: ctrl.prototype.collectionName,
                    entityType: (elementType.namespace || server.namespace) + "." + elementType.name
                });

                let resolveType = (elementType, parent) => {
                    let typeDefinition:any = {
                        name: elementType.name,
                        key: [],
                        property: [],
                        annotation: Edm.getAnnotations(elementType)
                    };
                    let namespace = elementType.namespace || parent.namespace || server.namespace;

                    let typeSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
                    if (!typeSchema){
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

                    let properties:string[] = Edm.getProperties(elementType.prototype);
                    properties.forEach((prop) => {
                        let propertyDefinition = {
                            name: prop,
                            type: Edm.getTypeName(elementType, prop),
                            nullable: Edm.isNullable(elementType, prop),
                            annotation: Edm.getAnnotations(elementType, prop)
                        };
                        if (Edm.isKey(elementType, prop)){
                            typeDefinition.key.push({
                                propertyRef: [{
                                    name: prop
                                }]
                            });
                        }
                        if (Edm.isComputed(elementType, prop)){
                            propertyDefinition.annotation.unshift({
                                term: "Org.OData.Core.V1.Computed",
                                bool: true
                            });
                        }
                        typeDefinition.property.push(propertyDefinition);

                        let type = Edm.getType(elementType, prop);
                        if (typeof type == "function" ){
                            let definitionContainer = Edm.isComplexType(elementType, prop) ? "complexType" : "entityType";
                            let resolvedType = resolveType(type, elementType);
                            if (!resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]){
                                resolvedType.schema[definitionContainer].push(resolvedType.definition);
                            }
                        }
                    });

                    return {
                        schema: typeSchema,
                        definition: typeDefinition
                    };
                };
                let resolvedType = resolveType(elementType, server);
                if (!resolvedType.schema.entityType.filter(et => et.name == resolvedType.definition.name)[0]){
                    resolvedType.schema.entityType.push(resolvedType.definition);
                }

                let operations:any = getAllOperations(ctrl);
                Object.keys(operations).forEach((operation) => {
                    let namespace = operations[operation].prototype[operation].namespace || elementType.namespace || server.namespace;
                    let elementTypeNamespace = elementType.namespace || server.namespace;
                    let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
                    if (!operationSchema){
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

                    if (Edm.isFunction(operations[operation], operation)){
                        let returnType = Edm.getReturnType(operations[operation], operation);
                        let parameters = Edm.getParameters(operations[operation], operation);
                        operationSchema.function.push({
                            name: operation,
                            isBound: true,
                            parameter: [{
                                name: "bindingParameter",
                                type: "Collection(" + elementTypeNamespace + "." + ctrl.prototype.elementType.name + ")"
                            }].concat(parameters),
                            returnType: returnType
                        });
                    }

                    if (Edm.isAction(operations[operation], operation)){
                        let returnType = Edm.getReturnType(operations[operation], operation);
                        let parameters = Edm.getParameters(operations[operation], operation);
                        operationSchema.function.push({
                            name: operation,
                            isBound: true,
                            parameter: [{
                                name: "bindingParameter",
                                type: "Collection(" + elementTypeNamespace + "." + ctrl.prototype.elementType.name + ")"
                            }].concat(parameters),
                            returnType: returnType
                        });
                    }
                });
            }

            let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == (server.prototype[i].namespace || server.namespace))[0];
            if (!operationSchema){
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
            if (Edm.isActionImport(server, i)){
                let returnType = Edm.getReturnType(server, i);
                let parameters = Edm.getParameters(server, i);
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

            if (Edm.isFunctionImport(server, i)){
                let returnType = Edm.getReturnType(server, i);
                let parameters = Edm.getParameters(server, i);
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