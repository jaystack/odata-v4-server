import { ODataController } from "./controller";
import { ODataServer } from "./server";
import * as Edm from "./edm";
import * as odata from "./odata";
import { getAllPropertyNames } from "./utils";

export function createMetadataJSON(server: typeof ODataServer) {
    if (!server.namespace) server.namespace = "Default";
    const containerType = Object.getPrototypeOf(server.container).constructor;
    if (containerType != Edm.ContainerBase && !containerType.namespace) containerType.namespace = server.namespace;

    const definition: any = {
        version: "4.0",
        dataServices: {
            schema: []
        }
    };
    const getAllOperations = function (target: Function): any {
        let ops = Edm.getOperations(target);
        let ret = {};
        ops.forEach(op => ret[op] = target);
        target = Object.getPrototypeOf(target.prototype);
        if (target instanceof ODataController) ret = Object.assign(getAllOperations(target.constructor), ret);
        return ret;
    };
    const propNames = getAllPropertyNames(server.prototype).filter(it => it != "constructor");
    const entitySets = odata.getPublicControllers(server);
    const resolveTypeDefinition = (elementType, prop, namespace, getType = Edm.getType, getTypeName = Edm.getTypeName) => {
        let defType = getType(elementType, prop, server.container);
        let defName = server.container.resolve(defType);
        let defNamespace = containerType.namespace || namespace;
        let defDefinition;

        if (!defName) {
            defName = defType["@odata.type"] || (defType["prototype"] && defType["prototype"]["@odata.type"]) || prop;
            if (defName.indexOf(".") > 0) {
                defNamespace = defName.slice(0, defName.lastIndexOf("."));
                defName = defName.slice(defName.lastIndexOf(".") + 1);
            }
            defDefinition = {
                name: defName,
                underlyingType: getTypeName(<Function>defType, undefined, server.container) || "System.Object"
            };
        } else {
            if (defName.indexOf(".") > 0) {
                defNamespace = defName.slice(0, defName.lastIndexOf("."));
                defName = defName.slice(defName.lastIndexOf(".") + 1);
            }
            defDefinition = {
                name: defName,
                underlyingType: getTypeName(containerType, defName, server.container) || "System.Object"
            };
        }

        let defSchema = definition.dataServices.schema.filter((schema) => schema.namespace == defNamespace)[0];
        if (!defSchema) {
            defSchema = {
                namespace: defNamespace,
                typeDefinition: [],
                enumType: [],
                entityType: [],
                complexType: [],
                action: [],
                function: [],
                entityContainer: [],
                annotation: []
            };
            definition.dataServices.schema.unshift(defSchema);
        }

        if (!defSchema.typeDefinition.filter(et => et.name == defName)[0]) {
            defSchema.typeDefinition.push(defDefinition);
        }

        return `${defNamespace}.${defName}`;
    };
    const resolveEnumType = (elementType, prop, namespace, enumType?, enumName?) => {
        enumType = enumType || Edm.getType(elementType, prop, server.container);
        enumName = enumName || Edm.getTypeName(elementType, prop, server.container);
        let enumNamespace = odata.getNamespace(containerType, server.container.resolve(enumType)) || namespace;
        let enumDefinition;

        if (!enumName) {
            enumName = enumType["@odata.type"] || prop;
            enumDefinition = {
                name: enumName,
                underlyingType: Edm.getTypeName(elementType, prop, server.container),
                isFlags: Edm.isFlags(elementType, prop),
                member: [],
                annotation: Edm.getAnnotations(enumType as any)
            };
        } else {
            if (enumName.indexOf(".") > 0) {
                enumNamespace = enumName.slice(0, enumName.lastIndexOf("."));
                enumName = enumName.slice(enumName.lastIndexOf(".") + 1);
            }
            enumDefinition = {
                name: enumName,
                underlyingType: Edm.getTypeName(containerType, `${enumNamespace}.${enumName}`, server.container) || Edm.getTypeName(containerType, enumName, server.container) || "Edm.Int32",
                isFlags: Edm.isFlags(containerType, `${enumNamespace}.${enumName}`) || Edm.isFlags(containerType, enumName),
                member: [],
                annotation: Edm.getAnnotations(enumType as any)
            };
        }

        let enumSchema = definition.dataServices.schema.filter((schema) => schema.namespace == enumNamespace)[0];
        if (!enumSchema) {
            enumSchema = {
                namespace: enumNamespace,
                typeDefinition: [],
                enumType: [],
                entityType: [],
                complexType: [],
                action: [],
                function: [],
                entityContainer: [],
                annotation: []
            };
            definition.dataServices.schema.unshift(enumSchema);
        }

        if (!enumSchema.enumType.filter(et => et.name == enumName)[0]) {
            Object.keys(enumType).forEach((member) => {
                if (!(/^[0-9@]/.test(member) || enumType[member] == "@odata.type")) {
                    enumDefinition.member.push({
                        name: member,
                        value: enumType[member],
                        annotation: Edm.getAnnotations(enumType as any, member)
                    });
                }
            });
            enumSchema.enumType.push(enumDefinition);
        }
        return `${enumNamespace}.${enumName}`;
    };
    const resolveOperation = (elementType, prop, namespace, isBound?, boundType?) => {
        let type = Edm.getReturnType(elementType, prop, server.container);
        if (Edm.isTypeDefinition(elementType, prop)) {
            type = resolveTypeDefinition(elementType, prop, namespace, Edm.getReturnType);
        } else if (Edm.isEnumType(elementType, prop)) {
            type = resolveEnumType(elementType, prop, namespace);
        } else if (typeof type == "function") {
            let definitionContainer = Edm.isEntityType(type) ? "entityType" : "complexType";
            let resolvedType = resolveType(type, elementType, prop);
            if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]) {
                resolvedType.schema[definitionContainer].push(resolvedType.definition);
            }
        }

        let returnType = Edm.getReturnTypeName(elementType, prop, server.container);
        let parameters = Edm.getParameters(elementType, prop).map(p => {
            let param = Object.assign({}, p);
            if (typeof param.type != "string") {
                let resolvedContainerType = server.container.resolve(param.type) || param.type.name;
                if (Edm.isTypeDefinition(param.type)){
                    param.type = resolveTypeDefinition(containerType, resolvedContainerType, namespace, Edm.getType, ():string => {
                        return Edm.getTypeName(containerType, resolvedContainerType, server.container);
                    });
                } else if (Edm.isEnumType(param.type)) {
                    param.type = resolveEnumType(containerType, resolvedContainerType, namespace, param.type, resolvedContainerType);
                } else {
                    if (typeof param.type == "function") {
                        let definitionContainer = Edm.isEntityType(param.type) ? "entityType" : "complexType";
                        let resolvedType = resolveType(param.type, elementType, prop, undefined, resolvedContainerType.indexOf(".") > 0 ? resolvedContainerType : `${param.type.namespace || namespace}.${resolvedContainerType}`);
                        if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]) {
                            resolvedType.schema[definitionContainer].push(resolvedType.definition);
                        }
                    }
                    if (resolvedContainerType.indexOf(".") > 0){
                        param.type = resolvedContainerType;
                    }else{
                        param.type = `${param.type.namespace || odata.getNamespace(containerType, resolvedContainerType) || namespace}.${resolvedContainerType}`;
                    }
                }
            }
            return param;
        });

        if (isBound) {
            parameters.unshift({
                name: "bindingParameter",
                type: boundType
            });
        }

        return {
            name: prop,
            isBound: isBound || false,
            parameter: parameters,
            returnType: { type: returnType }
        };
    };
    const resolveImport = (operationSchema, i, definition, type) => {
        operationSchema[type].push(definition);

        let containerName = server.prototype[i].containerName || "Default";
        let entityContainer = operationSchema.entityContainer.find(ec => ec.name == containerName);

        if (!entityContainer) {
            entityContainer = {
                name: containerName,
                entitySet: [],
                actionImport: [],
                functionImport: []
            };
            operationSchema.entityContainer.unshift(entityContainer);
        }

        entityContainer[`${type}Import`].push({
            name: i,
            [type]: (server.prototype[i].namespace || server.namespace) + "." + i
        });
    };
    let resolvingTypes = [];
    const resolveType = (elementType, parent, prop?, baseType?, paramTypeName?) => {
        if (resolvingTypes.indexOf(elementType) >= 0) return null;
        resolvingTypes.push(elementType);

        if (!elementType.namespace) elementType.namespace = server.container.resolve(elementType) ? (containerType.namespace || parent.namespace) : parent.namespace;

        let typeName = paramTypeName || Edm.getTypeName(parent, prop, server.container) || elementType.name;
        if (typeName.indexOf('Collection') == 0) typeName = elementType.name;
        let typeDefinition: any = {
            name: typeName.split('.').pop(),
            baseType: baseType ? (baseType.namespace || server.namespace) + "." + baseType.name : undefined,
            key: [],
            property: [],
            navigationProperty: [],
            annotation: Edm.getAnnotations(elementType),
            openType: Edm.isOpenType(elementType) || elementType === Object,
            hasStream: Edm.isMediaEntity(elementType)
        };
        let namespace = elementType.namespace || parent.namespace || server.namespace;

        let typeSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
        if (!typeSchema) {
            typeSchema = {
                namespace: namespace,
                typeDefinition: [],
                enumType: [],
                entityType: [],
                complexType: [],
                action: [],
                function: [],
                entityContainer: [],
                annotation: []
            };
            definition.dataServices.schema.unshift(typeSchema);
        }

        let properties: string[] = Edm.getProperties(elementType.prototype);
        properties.forEach((prop) => {
            let propertyDefinition = {
                name: prop,
                type: Edm.getTypeName(elementType, prop, server.container),
                nullable: Edm.isNullable(elementType, prop),
                maxLength: Edm.getMaxLength(elementType, prop),
                precision: Edm.getPrecision(elementType, prop),
                scale: Edm.getScale(elementType, prop),
                unicode: Edm.isUnicode(elementType, prop),
                SRID: Edm.getSRID(elementType, prop),
                concurrencyMode: Edm.getConcurrencyMode(elementType, prop),
                defaultValue: Edm.getDefaultValue(elementType, prop),
                annotation: Edm.getAnnotations(elementType, prop),
                partner: Edm.getPartner(elementType, prop)
            };
            if (Edm.isKey(elementType, prop)) {
                typeDefinition.key.push({
                    propertyRef: [{
                        name: prop
                    }]
                });
                propertyDefinition.nullable = false;
            }
            if (Edm.isComputed(elementType, prop)) {
                propertyDefinition.annotation.unshift({
                    term: "Org.OData.Core.V1.Computed",
                    bool: true
                });
            }

            if (Edm.isTypeDefinition(elementType, prop)) {
                propertyDefinition.type = resolveTypeDefinition(elementType, prop, namespace);
            } else if (Edm.isEnumType(elementType, prop)) {
                propertyDefinition.type = resolveEnumType(elementType, prop, namespace);
            } else {
                let type = Edm.getType(elementType, prop, server.container);
                if (typeof type == "function") {
                    let definitionContainer = Edm.isEntityType(elementType, prop) ? "entityType" : "complexType";
                    let resolvedType = resolveType(type, elementType, prop);
                    if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]) {
                        resolvedType.schema[definitionContainer].push(resolvedType.definition);
                    }

                    if (definitionContainer == "entityType") {
                        typeDefinition.navigationProperty.push(propertyDefinition);
                        return;
                    }
                }
            }

            typeDefinition.property.push(propertyDefinition);
        });

        let operations: any = getAllOperations(elementType);
        Object.keys(operations).forEach((operation) => {
            let namespace = operations[operation].prototype[operation].namespace || elementType.namespace || parent.namespace || server.namespace;
            let elementTypeNamespace = elementType.namespace || parent.namespace || server.namespace;
            let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
            if (!operationSchema) {
                operationSchema = {
                    namespace: namespace,
                    typeDefinition: [],
                    enumType: [],
                    entityType: [],
                    complexType: [],
                    action: [],
                    function: [],
                    entityContainer: [],
                    annotation: []
                };
                definition.dataServices.schema.unshift(operationSchema);
            }

            if (Edm.isFunction(operations[operation], operation)) {
                operationSchema.function.push(resolveOperation(operations[operation], operation, namespace, true, `${elementTypeNamespace}.${elementType.name}`));
            }

            if (Edm.isAction(operations[operation], operation)) {
                operationSchema.action.push(resolveOperation(operations[operation], operation, namespace, true, `${elementTypeNamespace}.${elementType.name}`));
            }
        });

        let __proto__ = Object.getPrototypeOf(elementType.prototype);
        if (!baseType && __proto__) baseType = __proto__.constructor;
        if (baseType && baseType != Object && Edm.getProperties(baseType.prototype).length > 0) {
            let resolvedType = resolveType(baseType, elementType, prop);
            typeDefinition.baseType = (baseType.namespace || server.namespace) + "." + baseType.name;
            let definitionContainer = Edm.isEntityType(baseType) ? "entityType" : "complexType";
            if (resolvedType && !resolvedType.schema[definitionContainer].filter(et => et.name == resolvedType.definition.name)[0]) {
                resolvedType.schema[definitionContainer].push(resolvedType.definition);
            }
        }
        let children = Edm.getChildren(elementType);
        children.forEach((child) => {
            let resolvedType = resolveType(child, elementType, prop, elementType);
            let definitionContainer = Edm.isEntityType(child) ? "entityType" : "complexType";
            if (resolvedType && !resolvedType.schema.entityType.filter(et => et.name == resolvedType.definition.name)[0]) {
                resolvedType.schema[definitionContainer].push(resolvedType.definition);
            }
        });

        return {
            schema: typeSchema,
            definition: typeDefinition
        };
    };
    propNames.forEach((i) => {
        if (i != "$metadata" && server.prototype[i]) {
            if (server.prototype[i].prototype instanceof ODataController) {
                let ctrl = server.prototype[i];
                if (!ctrl.namespace) ctrl.namespace = server.namespace;
                let elementType = ctrl.prototype.elementType;
                let containerName = ctrl.containerName || "Default";
                let ctrlSchema = definition.dataServices.schema.find((schema) => schema.namespace == ctrl.namespace);

                if (!ctrlSchema) {
                    ctrlSchema = {
                        namespace: ctrl.namespace,
                        typeDefinition: [],
                        enumType: [],
                        entityType: [],
                        complexType: [],
                        action: [],
                        function: [],
                        entityContainer: [],
                        annotation: []
                    };
                    definition.dataServices.schema.unshift(ctrlSchema);
                }

                for (var es in entitySets) {
                    if (entitySets[es] == ctrl) {
                        let entityContainer = ctrlSchema.entityContainer.find(ec => ec.name == containerName);

                        if (!entityContainer) {
                            entityContainer = {
                                name: containerName,
                                entitySet: [],
                                actionImport: [],
                                functionImport: []
                            };
                            ctrlSchema.entityContainer.unshift(entityContainer);
                        }

                        entityContainer.entitySet.push({
                            name: es,
                            entityType: Edm.getTypeName(server, i, server.container) || ((elementType.namespace || server.namespace) + "." + elementType.name)
                        });
                    }
                }

                let resolvedType = resolveType(elementType, server, i);
                if (resolvedType && !resolvedType.schema.entityType.filter(et => et.name == resolvedType.definition.name)[0]) {
                    resolvedType.schema.entityType.push(resolvedType.definition);
                }

                let operations: any = getAllOperations(ctrl);
                Object.keys(operations).forEach((operation) => {
                    let namespace = operations[operation].prototype[operation].namespace || elementType.namespace || server.namespace;
                    let elementTypeNamespace = elementType.namespace || server.namespace;
                    let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == namespace)[0];
                    if (!operationSchema) {
                        operationSchema = {
                            namespace: namespace,
                            typeDefinition: [],
                            enumType: [],
                            entityType: [],
                            complexType: [],
                            action: [],
                            function: [],
                            entityContainer: [],
                            annotation: []
                        };
                        definition.dataServices.schema.unshift(operationSchema);
                    }

                    if (Edm.isFunction(operations[operation], operation)) {
                        operationSchema.function.push(resolveOperation(operations[operation], operation, namespace, true, `Collection(${elementTypeNamespace}.${ctrl.prototype.elementType.name})`));
                    }

                    if (Edm.isAction(operations[operation], operation)) {
                        operationSchema.action.push(resolveOperation(operations[operation], operation, namespace, true, `Collection(${elementTypeNamespace}.${ctrl.prototype.elementType.name})`));
                    }
                });
            }
        }
    });

    propNames.forEach((i) => {
        if (i != "$metadata" && server.prototype[i]) {
            let operationNamespace = server.prototype[i].namespace || server.namespace;
            let operationSchema = definition.dataServices.schema.filter((schema) => schema.namespace == operationNamespace)[0];
            if (!operationSchema) {
                operationSchema = {
                    namespace: operationNamespace,
                    typeDefinition: [],
                    enumType: [],
                    entityType: [],
                    complexType: [],
                    action: [],
                    function: [],
                    entityContainer: [],
                    annotation: []
                };
                definition.dataServices.schema.unshift(operationSchema);
            }

            if (Edm.isActionImport(server, i)) {
                resolveImport(operationSchema, i, resolveOperation(server, i, operationNamespace), "action");
            }

            if (Edm.isFunctionImport(server, i)) {
                resolveImport(operationSchema, i, resolveOperation(server, i, operationNamespace), "function");
            }
        }
    });

    definition.dataServices.schema = definition.dataServices.schema.sort((a, b) => a.namespace.localeCompare(b.namespace));
    definition.dataServices.schema.forEach((schema) => {
        schema.typeDefinition = schema.typeDefinition.sort((a, b) => a.name.localeCompare(b.name));
        schema.enumType = schema.enumType.sort((a, b) => a.name.localeCompare(b.name));
        schema.entityType = schema.entityType.sort((a, b) => a.name.localeCompare(b.name));
        schema.complexType = schema.complexType.sort((a, b) => a.name.localeCompare(b.name));
        schema.entityContainer = schema.entityContainer.sort((a, b) => a.name.localeCompare(b.name));
    });
    return definition;
}