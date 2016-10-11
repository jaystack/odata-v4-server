"use strict";
require("reflect-metadata");
const utils_1 = require("./utils");
var Edm;
(function (Edm) {
    const EdmProperties = "edm:properties";
    const EdmKeyProperties = "edm:keyproperties";
    const EdmKeyProperty = "edm:keyproperty";
    const EdmForeignKeys = "edm:foreignkeys";
    const EdmComputedProperty = "edm:computedproperty";
    const EdmNullableProperty = "edm:nullableproperty";
    const EdmRequiredProperty = "edm:requiredproperty";
    const EdmPartnerProperty = "edm:partnerproperty";
    const EdmType = "edm:type";
    const EdmElementType = "edm:elementtype";
    const EdmComplexType = "edm:complextype";
    const EdmEntityType = "edm:entitytype";
    const EdmOperations = "edm:operations";
    const EdmAction = "edm:action";
    const EdmFunction = "edm:function";
    const EdmReturnType = "edm:returntype";
    const EdmParameters = "edm:parameters";
    const EdmAnnotations = "edm:annotations";
    const EdmConverter = "edm:converter";
    const EdmEntitySet = "edm:entityset";
    const EdmMediaEntity = "edm:mediaentity";
    const EdmOpenType = "emd:opentype";
    const EdmContainer = [];
    function typeDecoratorFactory(type) {
        let decorator = function (target, targetKey, parameterIndex) {
            if (typeof parameterIndex != "undefined") {
                let parameterNames = utils_1.getFunctionParameters(target, targetKey);
                let existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                let paramName = parameterNames[parameterIndex];
                let param = existingParameters.filter(p => p.name == paramName)[0];
                if (param) {
                    param.type = type;
                }
                else {
                    existingParameters.push({
                        name: paramName,
                        type: type
                    });
                }
                Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
            }
            else {
                if (typeof target == "function") {
                    Edm.register(target);
                }
                if (targetKey != EdmType) {
                    let properties = Reflect.getMetadata(EdmProperties, target) || [];
                    if (properties.indexOf(targetKey) < 0)
                        properties.push(targetKey);
                    Reflect.defineMetadata(EdmProperties, properties, target);
                }
                Reflect.defineMetadata(EdmType, type, target, targetKey);
            }
        };
        return function (target, targetKey, parameterIndex) {
            if (arguments.length == 0)
                return decorator;
            else
                return decorator(target, targetKey, parameterIndex);
        };
    }
    Edm.Binary = typeDecoratorFactory("Edm.Binary");
    Edm.Boolean = typeDecoratorFactory("Edm.Boolean");
    Edm.Byte = typeDecoratorFactory("Edm.Byte");
    Edm.Date = typeDecoratorFactory("Edm.Date");
    Edm.DateTimeOffset = typeDecoratorFactory("Edm.DateTimeOffset");
    Edm.Decimal = typeDecoratorFactory("Edm.Decimal");
    Edm.Double = typeDecoratorFactory("Edm.Double");
    Edm.Duration = typeDecoratorFactory("Edm.Duration");
    Edm.Guid = typeDecoratorFactory("Edm.Guid");
    Edm.Int16 = typeDecoratorFactory("Edm.Int16");
    Edm.Int32 = typeDecoratorFactory("Edm.Int32");
    Edm.Int64 = typeDecoratorFactory("Edm.Int64");
    Edm.SByte = typeDecoratorFactory("Edm.SByte");
    Edm.Single = typeDecoratorFactory("Edm.Single");
    Edm.Stream = typeDecoratorFactory("Edm.Stream");
    Edm.String = typeDecoratorFactory("Edm.String");
    Edm.TimeOfDay = typeDecoratorFactory("Edm.TimeOfDay");
    Edm.Geography = typeDecoratorFactory("Edm.Geography");
    Edm.GeographyPoint = typeDecoratorFactory("Edm.GeographyPoint");
    Edm.GeographyLineString = typeDecoratorFactory("Edm.GeographyLineString");
    Edm.GeographyPolygon = typeDecoratorFactory("Edm.GeographyPolygon");
    Edm.GeographyMultiPoint = typeDecoratorFactory("Edm.GeographyMultiPoint");
    Edm.GeographyMultiLineString = typeDecoratorFactory("Edm.GeographyMultiLineString");
    Edm.GeographyMultiPolygon = typeDecoratorFactory("Edm.GeographyMultiPolygon");
    Edm.GeographyCollection = (function GeographyCollection() {
        return typeDecoratorFactory("Edm.GeographyCollection");
    })();
    Edm.Geometry = (function Geometry() {
        return typeDecoratorFactory("Edm.Geometry");
    })();
    Edm.GeometryPoint = (function GeometryPoint() {
        return typeDecoratorFactory("Edm.GeometryPoint");
    })();
    Edm.GeometryLineString = (function GeometryLineString() {
        return typeDecoratorFactory("Edm.GeometryLineString");
    })();
    Edm.GeometryPolygon = (function GeometryPolygon() {
        return typeDecoratorFactory("Edm.GeometryPolygon");
    })();
    Edm.GeometryMultiPoint = (function GeometryMultiPoint() {
        return typeDecoratorFactory("Edm.GeometryMultiPoint");
    })();
    Edm.GeometryMultiLineString = (function GeometryMultiLineString() {
        return typeDecoratorFactory("Edm.GeometryMultiLineString");
    })();
    Edm.GeometryMultiPolygon = (function GeometryMultiPolygon() {
        return typeDecoratorFactory("Edm.GeometryMultiPolygon");
    })();
    Edm.GeometryCollection = (function GeometryCollection() {
        return typeDecoratorFactory("Edm.GeometryCollection");
    })();
    function Collection(elementType) {
        return function (target, targetKey, parameterIndex) {
            if (typeof parameterIndex != "undefined") {
                let parameterNames = utils_1.getFunctionParameters(target, targetKey);
                let existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                let element = function Collection() { };
                Reflect.decorate([elementType()], element, EdmType);
                let elementTypeName = Reflect.getMetadata(EdmType, element, EdmType);
                if (typeof elementTypeName == "function") {
                    elementTypeName = (elementTypeName.namespace || target.namespace) + "." + elementTypeName.name;
                }
                let paramName = parameterNames[parameterIndex];
                let param = existingParameters.filter(p => p.name == paramName)[0];
                if (param) {
                    param.type = "Collection(" + elementTypeName + ")";
                }
                else {
                    existingParameters.push({
                        name: paramName,
                        type: "Collection(" + elementTypeName + ")"
                    });
                }
                Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
            }
            else {
                if (typeof target == "function") {
                    Edm.register(target);
                }
                let properties = Reflect.getMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0)
                    properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
                let element = function Collection() { };
                try {
                    Reflect.decorate([elementType()], element, EdmType);
                }
                catch (err) {
                    Reflect.decorate([elementType], element, EdmType);
                }
                let type = Reflect.getMetadata(EdmComplexType, element, EdmType);
                let elementTypeName = Reflect.getMetadata(EdmType, element, EdmType);
                Reflect.defineMetadata(EdmType, "Collection", target, targetKey);
                Reflect.defineMetadata(EdmElementType, elementTypeName, target, targetKey);
                if (type) {
                    Reflect.defineMetadata(EdmComplexType, type, target, targetKey);
                }
                else {
                    type = Reflect.getMetadata(EdmEntityType, element, EdmType);
                    Reflect.defineMetadata(EdmEntityType, type, target, targetKey);
                }
            }
        };
    }
    Edm.Collection = Collection;
    function getTypeName(target, propertyKey) {
        let type = Reflect.getMetadata(EdmType, target.prototype, propertyKey) || Reflect.getMetadata(EdmType, target.prototype);
        let elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey) || Reflect.getMetadata(EdmElementType, target.prototype);
        if (typeof type == "string" && type != "Collection" && type.indexOf(".") < 0) {
            for (let i = 0; i < EdmContainer.length; i++) {
                let containerType = EdmContainer[i];
                let namespace = containerType.namespace || target.namespace || "Default";
                let containerTypeName = containerType.name;
                if (containerTypeName == type) {
                    type = namespace + "." + type;
                    break;
                }
            }
        }
        else if (typeof type == "function") {
            type = (type.namespace || target.namespace || "Default") + "." + type.name;
        }
        if (typeof elementType == "string" && elementType != "Collection" && elementType.indexOf(".") < 0) {
            for (let i = 0; i < EdmContainer.length; i++) {
                let containerType = EdmContainer[i];
                let namespace = containerType.namespace || target.namespace || "Default";
                let containerTypeName = containerType.name;
                if (containerTypeName == elementType) {
                    elementType = namespace + "." + elementType;
                    break;
                }
            }
        }
        else if (typeof elementType == "function") {
            elementType = (elementType.namespace || target.namespace || "Default") + "." + elementType.name;
        }
        return elementType ? type + "(" + elementType + ")" : type;
    }
    Edm.getTypeName = getTypeName;
    function getType(target, propertyKey) {
        let type = Reflect.getMetadata(EdmType, target.prototype, propertyKey);
        let elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
        let isEntityType = Edm.isEntityType(target, propertyKey);
        if (!elementType)
            elementType = type;
        if (isEntityType) {
            if (typeof elementType == "string" && elementType.indexOf(".") < 0)
                elementType = (target.namespace || "Default") + "." + elementType;
            if (typeof type == "string" && type.indexOf(".") < 0)
                type = (target.namespace || "Default") + "." + type;
        }
        for (let i = 0; i < EdmContainer.length; i++) {
            let containerType = EdmContainer[i];
            let namespace = containerType.namespace || target.namespace || "Default";
            let containerTypeName = (namespace ? namespace + "." : "") + containerType.name;
            if (containerTypeName == elementType) {
                return containerType;
            }
        }
        return elementType;
    }
    Edm.getType = getType;
    function isCollection(target, propertyKey) {
        return Reflect.getMetadata(EdmType, target.prototype, propertyKey) == "Collection";
    }
    Edm.isCollection = isCollection;
    function getProperties(target) {
        return Reflect.getMetadata(EdmProperties, target) || [];
    }
    Edm.getProperties = getProperties;
    function getParameters(target, targetKey) {
        return Reflect.getMetadata(EdmParameters, target.prototype, targetKey) || [];
    }
    Edm.getParameters = getParameters;
    Edm.Key = (function Key() {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            let properties = Reflect.getMetadata(EdmKeyProperties, target) || [];
            if (properties.indexOf(targetKey) < 0)
                properties.push(targetKey);
            Reflect.defineMetadata(EdmKeyProperties, properties, target);
            Reflect.defineMetadata(EdmKeyProperty, true, target, targetKey);
        };
    })();
    function isKey(target, propertyKey) {
        return Reflect.getMetadata(EdmKeyProperty, target.prototype, propertyKey) || false;
    }
    Edm.isKey = isKey;
    function getKeyProperties(target) {
        return Reflect.getMetadata(EdmKeyProperties, target) || Reflect.getMetadata(EdmKeyProperties, target.prototype) || [];
    }
    Edm.getKeyProperties = getKeyProperties;
    function escape(value, type) {
        switch (type) {
            case "Edm.Binary":
                return value.toString("hex");
            case "Edm.Boolean":
            case "Edm.Byte":
            case "Edm.Decimal":
            case "Edm.Double":
            case "Edm.Guid":
            case "Edm.Int16":
            case "Edm.Int32":
            case "Edm.Int64":
            case "Edm.SByte":
            case "Edm.Single":
                return value.toString();
            case "Edm.String": return "'" + ("" + value).replace(/'/g, "''") + "'";
        }
    }
    Edm.escape = escape;
    Edm.Computed = (function Computed() {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            Reflect.defineMetadata(EdmComputedProperty, true, target, targetKey);
        };
    })();
    function isComputed(target, propertyKey) {
        return Reflect.getMetadata(EdmComputedProperty, target.prototype, propertyKey) || false;
    }
    Edm.isComputed = isComputed;
    Edm.Nullable = (function Nullable() {
        return function (target, targetKey, parameterIndex) {
            if (typeof parameterIndex != "undefined") {
                let parameterNames = utils_1.getFunctionParameters(target, targetKey);
                let existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                let paramName = parameterNames[parameterIndex];
                let param = existingParameters.filter(p => p.name == paramName)[0];
                if (param) {
                    param.nullable = true;
                }
                else {
                    existingParameters.push({
                        name: parameterNames[parameterIndex],
                        nullable: true
                    });
                }
                Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
            }
            else {
                if (typeof target == "function") {
                    Edm.register(target);
                }
                Reflect.defineMetadata(EdmNullableProperty, true, target, targetKey);
            }
        };
    })();
    function isNullable(target, propertyKey) {
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey);
    }
    Edm.isNullable = isNullable;
    Edm.Required = (function Required() {
        return function (target, targetKey, parameterIndex) {
            if (typeof parameterIndex != "undefined") {
                let parameterNames = utils_1.getFunctionParameters(target, targetKey);
                let existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                let paramName = parameterNames[parameterIndex];
                let param = existingParameters.filter(p => p.name == paramName)[0];
                if (param) {
                    param.nullable = false;
                }
                else {
                    existingParameters.push({
                        name: parameterNames[parameterIndex],
                        nullable: false
                    });
                }
                Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
            }
            else {
                if (typeof target == "function") {
                    Edm.register(target);
                }
                Reflect.defineMetadata(EdmNullableProperty, false, target, targetKey);
            }
        };
    })();
    function isRequired(target, propertyKey) {
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey) == false ? true : false;
    }
    Edm.isRequired = isRequired;
    function operationDecoratorFactory(type, returnType) {
        return function (target, targetKey) {
            let element = target;
            if (typeof returnType != "undefined") {
                try {
                    Reflect.decorate([returnType()], element, EdmReturnType);
                }
                catch (err) {
                    returnType(element, EdmReturnType);
                }
            }
            Reflect.defineMetadata(type, type, target, targetKey);
        };
    }
    Edm.ActionImport = operationDecoratorFactory(EdmAction);
    Edm.Action = operationDecoratorFactory(EdmAction);
    function FunctionImport(returnType) {
        return operationDecoratorFactory(EdmFunction, returnType);
    }
    Edm.FunctionImport = FunctionImport;
    function Function(returnType) {
        return function (target, targetKey) {
            let existingOperations = Reflect.getOwnMetadata(EdmOperations, target) || [];
            existingOperations.push(targetKey);
            Reflect.defineMetadata(EdmOperations, existingOperations, target);
            operationDecoratorFactory(EdmFunction, returnType)(target, targetKey);
        };
    }
    Edm.Function = Function;
    function getOperations(target) {
        return Reflect.getOwnMetadata(EdmOperations, target.prototype) || [];
    }
    Edm.getOperations = getOperations;
    function getReturnTypeName(target, propertyKey) {
        return Edm.getTypeName(target, EdmReturnType);
    }
    Edm.getReturnTypeName = getReturnTypeName;
    function getReturnType(target, propertyKey) {
        return Edm.getType(target, EdmReturnType);
    }
    Edm.getReturnType = getReturnType;
    function isActionImport(target, propertyKey) {
        return Reflect.getMetadata(EdmAction, target.prototype, propertyKey) || false;
    }
    Edm.isActionImport = isActionImport;
    function isFunctionImport(target, propertyKey) {
        return Reflect.getMetadata(EdmFunction, target.prototype, propertyKey) || false;
    }
    Edm.isFunctionImport = isFunctionImport;
    function isAction(target, propertyKey) {
        return Reflect.getMetadata(EdmAction, target.prototype, propertyKey) || false;
    }
    Edm.isAction = isAction;
    function isFunction(target, propertyKey) {
        return Reflect.getMetadata(EdmFunction, target.prototype, propertyKey) || false;
    }
    Edm.isFunction = isFunction;
    function ComplexType(type) {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            if (targetKey != EdmType) {
                let properties = Reflect.getMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0)
                    properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            Reflect.defineMetadata(EdmComplexType, type, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        };
    }
    Edm.ComplexType = ComplexType;
    function isComplexType(target, propertyKey) {
        return Reflect.hasMetadata(EdmComplexType, target.prototype, propertyKey);
    }
    Edm.isComplexType = isComplexType;
    function MediaEntity(contentType) {
        return Reflect.metadata(EdmMediaEntity, contentType);
    }
    Edm.MediaEntity = MediaEntity;
    function isMediaEntity(target) {
        return Reflect.hasMetadata(EdmMediaEntity, target);
    }
    Edm.isMediaEntity = isMediaEntity;
    function getContentType(target) {
        return Reflect.getMetadata(EdmMediaEntity, target);
    }
    Edm.getContentType = getContentType;
    Edm.OpenType = (function OpenType() {
        return Reflect.metadata(EdmOpenType, true);
    })();
    function isOpenType(target) {
        return Reflect.hasMetadata(EdmOpenType, target) || false;
    }
    Edm.isOpenType = isOpenType;
    function EntityType(type) {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            if (targetKey != EdmType) {
                let properties = Reflect.getMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0)
                    properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            Reflect.defineMetadata(EdmEntityType, type, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        };
    }
    Edm.EntityType = EntityType;
    function isEntityType(target, propertyKey) {
        return Reflect.hasMetadata(EdmEntityType, target.prototype, propertyKey);
    }
    Edm.isEntityType = isEntityType;
    function register(type) {
        if (EdmContainer.indexOf(type) < 0)
            EdmContainer.push(type);
    }
    Edm.register = register;
    function Convert(converter) {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            Reflect.defineMetadata(EdmConverter, converter, target, targetKey);
        };
    }
    Edm.Convert = Convert;
    function getConverter(target, propertyKey) {
        return Reflect.getMetadata(EdmConverter, target.prototype, propertyKey);
    }
    Edm.getConverter = getConverter;
    function Annotate(...annotation) {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            let existingAnnotations = Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
            existingAnnotations = annotation.concat(existingAnnotations);
            Reflect.defineMetadata(EdmAnnotations, existingAnnotations, target, targetKey);
        };
    }
    Edm.Annotate = Annotate;
    function getAnnotations(target, targetKey) {
        return Reflect.getOwnMetadata(EdmAnnotations, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
    }
    Edm.getAnnotations = getAnnotations;
    function ForeignKey(...keys) {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            let existingForeignKeys = Reflect.getOwnMetadata(EdmForeignKeys, target, targetKey) || [];
            existingForeignKeys = keys.concat(existingForeignKeys);
            Reflect.defineMetadata(EdmForeignKeys, existingForeignKeys, target, targetKey);
        };
    }
    Edm.ForeignKey = ForeignKey;
    function getForeignKeys(target, targetKey) {
        return Reflect.getOwnMetadata(EdmForeignKeys, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmForeignKeys, target, targetKey) || [];
    }
    Edm.getForeignKeys = getForeignKeys;
    function Partner(property) {
        return Reflect.metadata(EdmPartnerProperty, property);
    }
    Edm.Partner = Partner;
    function getPartner(target, targetKey) {
        return Reflect.getMetadata(EdmPartnerProperty, target, targetKey) || Reflect.getMetadata(EdmPartnerProperty, target.prototype, targetKey);
    }
    Edm.getPartner = getPartner;
    function EntitySet(name) {
        return function (controller) {
            controller.prototype.entitySetName = name;
        };
    }
    Edm.EntitySet = EntitySet;
})(Edm = exports.Edm || (exports.Edm = {}));
//# sourceMappingURL=edm.js.map