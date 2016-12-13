import * as extend from "extend";
import { Edm as Metadata } from "odata-v4-metadata";
import { ODataController } from "./controller";
import { ODataServer } from "./server";
import * as Edm from "./edm";
import * as odata from "./odata";
import { getAllPropertyNames } from "./utils";

export function createMetadataJSON(server:typeof ODataServer){
    if (!server.namespace) server.namespace = "Default";

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
                    name: server.containerName || "Default",
                    entitySet: [],
                    actionImport: [],
                    functionImport: []
                },
                annotations: []
            }]
        }
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
    let entitySets = odata.getPublicControllers(server);
    let resolvingTypes = [];
    let resolveType = (elementType, parent) => {
        if (resolvingTypes.indexOf(elementType) >= 0) return null;
        resolvingTypes.push(elementType);

        if (!elementType.namespace) elementType.namespace = parent.namespace;
        
        let typeDefinition:any = {
            name: elementType.name,
            key: [],
            property: [],
            navigationProperty: [],
            annotation: Edm.getAnnotations(elementType),
            openType: Edm.isOpenType(elementType) || elementType === Object,
            hasStream: Edm.isMediaEntity(elementType)
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
                annotation: Edm.getAnnotations(elementType, prop),
                partner: Edm.getPartner(elementType, prop)
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

            let type = Edm.getType(elementType, prop);
            if (typeof type == "function"){
                let definitionContainer = Edm.isComplexType(elementType, prop) ? "complexType" : "entityType";
                let resolvedType = resolveType(type, elementType);
                if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]){
                    resolvedType.schema[definitionContainer].push(resolvedType.definition);
                }

                if (definitionContainer == "entityType"){
                    typeDefinition.navigationProperty.push(propertyDefinition);
                    return;
                }
            }

            typeDefinition.property.push(propertyDefinition);
        });

        let operations:any = getAllOperations(elementType);
        Object.keys(operations).forEach((operation) => {
            let namespace = operations[operation].prototype[operation].namespace || elementType.namespace || parent.namespace || server.namespace;
            let elementTypeNamespace = elementType.namespace || parent.namespace || server.namespace;
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
                let type = Edm.getReturnType(operations[operation], operation);
                if (typeof type == "function"){
                    operations[operation].namespace = namespace;
                    let definitionContainer = Edm.isComplexType(operations[operation], operation) ? "complexType" : "entityType";
                    let resolvedType = resolveType(type, operations[operation]);
                    if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]){
                        resolvedType.schema[definitionContainer].push(resolvedType.definition);
                    }
                }

                let returnType = Edm.getReturnTypeName(operations[operation], operation);
                let parameters = Edm.getParameters(operations[operation], operation);
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

            if (Edm.isAction(operations[operation], operation)){
                let returnType = Edm.getReturnTypeName(operations[operation], operation);
                let parameters = Edm.getParameters(operations[operation], operation);
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
    propNames.forEach((i) => {
        if (i != "$metadata" && server.prototype[i]){
            let containerSchema = definition.dataServices.schema.filter((schema) => schema.namespace == server.namespace)[0];
            if (server.prototype[i].prototype instanceof ODataController){
                let ctrl = server.prototype[i];
                if (!ctrl.namespace) ctrl.constructor.namespace = server.namespace;
                let elementType = ctrl.prototype.elementType;
                for (var es in entitySets){
                    if (entitySets[es] == ctrl){
                        containerSchema.entityContainer.entitySet.push({
                            name: es,
                            entityType: (elementType.namespace || server.namespace) + "." + elementType.name
                        });
                    }
                }

                let resolvedType = resolveType(elementType, server);
                if (resolvedType && !resolvedType.schema.entityType.filter(et => et.name == resolvedType.definition.name)[0]){
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
                        let type = Edm.getReturnType(operations[operation], operation);
                        if (typeof type == "function"){
                            operations[operation].namespace = namespace;
                            let definitionContainer = Edm.isComplexType(operations[operation], operation) ? "complexType" : "entityType";
                            let resolvedType = resolveType(type, operations[operation]);
                            if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]){
                                resolvedType.schema[definitionContainer].push(resolvedType.definition);
                            }
                        }

                        let returnType = Edm.getReturnTypeName(operations[operation], operation);
                        let parameters = Edm.getParameters(operations[operation], operation);
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

                    if (Edm.isAction(operations[operation], operation)){
                        let returnType = Edm.getReturnTypeName(operations[operation], operation);
                        let parameters = Edm.getParameters(operations[operation], operation);
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
        if (i != "$metadata" && server.prototype[i]){
            let containerSchema = definition.dataServices.schema.filter((schema) => schema.namespace == server.namespace)[0];
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
                let parameters = Edm.getParameters(server, i);
                operationSchema.action.push({
                    name: i,
                    isBound: false,
                    parameter: parameters
                });
                containerSchema.entityContainer.actionImport.push({
                    name: i,
                    action: (server.prototype[i].namespace || server.namespace) + "." + i
                });
            }

            if (Edm.isFunctionImport(server, i)){
                let type = Edm.getReturnType(server, i);
                if (typeof type == "function"){
                    let definitionContainer = Edm.isComplexType(server, i) ? "complexType" : "entityType";
                    let resolvedType = resolveType(type, server);
                    if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]){
                        resolvedType.schema[definitionContainer].push(resolvedType.definition);
                    }
                }

                let returnType = Edm.getReturnTypeName(server, i);
                let parameters = Edm.getParameters(server, i);
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