"use strict";
require("reflect-metadata");
const utils_1 = require("./utils");
class Entity {
    constructor(entity) {
        if (typeof entity != "undefined") {
            let proto = Object.getPrototypeOf(this);
            Edm.getProperties(proto).forEach((prop) => {
                let type = Edm.getType(proto.constructor, prop);
                let converter = Edm.getConverter(proto.constructor, prop);
                let isCollection = Edm.isCollection(proto.constructor, prop);
                if (isCollection && entity[prop]) {
                    let value = Array.isArray(entity[prop]) ? entity[prop] : [entity[prop]];
                    if (typeof type == "function")
                        this[prop] = value.map(it => new type(it));
                    else if (typeof converter == "function")
                        this[prop] = value.map(it => converter(it));
                    else
                        this[prop] = value;
                }
                else {
                    if (typeof type == "function" && entity[prop])
                        this[prop] = new type(entity[prop]);
                    else if (typeof converter == "function")
                        this[prop] = converter(entity[prop]);
                    else
                        this[prop] = entity[prop];
                }
            });
        }
    }
}
exports.Entity = Entity;
var Edm;
(function (Edm) {
    const EdmProperties = "edm:properties";
    const EdmKeyProperties = "edm:keyproperties";
    const EdmKeyProperty = "edm:keyproperty";
    const EdmForeignKeys = "edm:foreignkeys";
    const EdmComputedProperty = "edm:computedproperty";
    const EdmNullableProperty = "edm:nullableproperty";
    const EdmRequiredProperty = "edm:requiredproperty";
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
    const EdmContainer = [];
    function typeDecoratorFactory(type) {
        return function (target, targetKey, parameterIndex) {
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
    }
    function Binary() {
        return typeDecoratorFactory("Edm.Binary");
    }
    Edm.Binary = Binary;
    function Boolean() {
        return typeDecoratorFactory("Edm.Boolean");
    }
    Edm.Boolean = Boolean;
    function Byte() {
        return typeDecoratorFactory("Edm.Byte");
    }
    Edm.Byte = Byte;
    function Date() {
        return typeDecoratorFactory("Edm.Date");
    }
    Edm.Date = Date;
    function DateTimeOffset() {
        return typeDecoratorFactory("Edm.DateTimeOffset");
    }
    Edm.DateTimeOffset = DateTimeOffset;
    function Decimal() {
        return typeDecoratorFactory("Edm.Decimal");
    }
    Edm.Decimal = Decimal;
    function Double() {
        return typeDecoratorFactory("Edm.Double");
    }
    Edm.Double = Double;
    function Duration() {
        return typeDecoratorFactory("Edm.Duration");
    }
    Edm.Duration = Duration;
    function Guid() {
        return typeDecoratorFactory("Edm.Guid");
    }
    Edm.Guid = Guid;
    function Int16() {
        return typeDecoratorFactory("Edm.Int16");
    }
    Edm.Int16 = Int16;
    function Int32() {
        return typeDecoratorFactory("Edm.Int32");
    }
    Edm.Int32 = Int32;
    function Int64() {
        return typeDecoratorFactory("Edm.Int64");
    }
    Edm.Int64 = Int64;
    function SByte() {
        return typeDecoratorFactory("Edm.SByte");
    }
    Edm.SByte = SByte;
    function Single() {
        return typeDecoratorFactory("Edm.Single");
    }
    Edm.Single = Single;
    function Stream() {
        return typeDecoratorFactory("Edm.Stream");
    }
    Edm.Stream = Stream;
    function String() {
        return typeDecoratorFactory("Edm.String");
    }
    Edm.String = String;
    function TimeOfDay() {
        return typeDecoratorFactory("Edm.TimeOfDay");
    }
    Edm.TimeOfDay = TimeOfDay;
    function Geography() {
        return typeDecoratorFactory("Edm.Geography");
    }
    Edm.Geography = Geography;
    function GeographyPoint() {
        return typeDecoratorFactory("Edm.GeographyPoint");
    }
    Edm.GeographyPoint = GeographyPoint;
    function GeographyLineString() {
        return typeDecoratorFactory("Edm.GeographyLineString");
    }
    Edm.GeographyLineString = GeographyLineString;
    function GeographyPolygon() {
        return typeDecoratorFactory("Edm.GeographyPolygon");
    }
    Edm.GeographyPolygon = GeographyPolygon;
    function GeographyMultiPoint() {
        return typeDecoratorFactory("Edm.GeographyMultiPoint");
    }
    Edm.GeographyMultiPoint = GeographyMultiPoint;
    function GeographyMultiLineString() {
        return typeDecoratorFactory("Edm.GeographyMultiLineString");
    }
    Edm.GeographyMultiLineString = GeographyMultiLineString;
    function GeographyMultiPolygon() {
        return typeDecoratorFactory("Edm.GeographyMultiPolygon");
    }
    Edm.GeographyMultiPolygon = GeographyMultiPolygon;
    function GeographyCollection() {
        return typeDecoratorFactory("Edm.GeographyCollection");
    }
    Edm.GeographyCollection = GeographyCollection;
    function Geometry() {
        return typeDecoratorFactory("Edm.Geometry");
    }
    Edm.Geometry = Geometry;
    function GeometryPoint() {
        return typeDecoratorFactory("Edm.GeometryPoint");
    }
    Edm.GeometryPoint = GeometryPoint;
    function GeometryLineString() {
        return typeDecoratorFactory("Edm.GeometryLineString");
    }
    Edm.GeometryLineString = GeometryLineString;
    function GeometryPolygon() {
        return typeDecoratorFactory("Edm.GeometryPolygon");
    }
    Edm.GeometryPolygon = GeometryPolygon;
    function GeometryMultiPoint() {
        return typeDecoratorFactory("Edm.GeometryMultiPoint");
    }
    Edm.GeometryMultiPoint = GeometryMultiPoint;
    function GeometryMultiLineString() {
        return typeDecoratorFactory("Edm.GeometryMultiLineString");
    }
    Edm.GeometryMultiLineString = GeometryMultiLineString;
    function GeometryMultiPolygon() {
        return typeDecoratorFactory("Edm.GeometryMultiPolygon");
    }
    Edm.GeometryMultiPolygon = GeometryMultiPolygon;
    function GeometryCollection() {
        return typeDecoratorFactory("Edm.GeometryCollection");
    }
    Edm.GeometryCollection = GeometryCollection;
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
        let type = Reflect.getMetadata(EdmType, target.prototype, propertyKey);
        let elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
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
            if (containerTypeName == elementType || containerTypeName == type) {
                return containerType;
            }
        }
        return elementType || type;
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
    function Key() {
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
    }
    Edm.Key = Key;
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
    function Computed() {
        return function (target, targetKey) {
            if (typeof target == "function") {
                Edm.register(target);
            }
            Reflect.defineMetadata(EdmComputedProperty, true, target, targetKey);
        };
    }
    Edm.Computed = Computed;
    function isComputed(target, propertyKey) {
        return Reflect.getMetadata(EdmComputedProperty, target.prototype, propertyKey) || false;
    }
    Edm.isComputed = isComputed;
    function Nullable() {
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
    }
    Edm.Nullable = Nullable;
    function isNullable(target, propertyKey) {
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey);
    }
    Edm.isNullable = isNullable;
    function Required() {
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
    }
    Edm.Required = Required;
    function isRequired(target, propertyKey) {
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey) == false ? true : false;
    }
    Edm.isRequired = isRequired;
    function operationDecoratorFactory(type, returnType) {
        return function (target, targetKey) {
            let element = function () { };
            if (typeof returnType != "undefined") {
                try {
                    Reflect.decorate([returnType()], element, EdmType);
                }
                catch (err) {
                    returnType(element);
                }
                let typeName = Reflect.getMetadata(EdmType, element, EdmType) || Reflect.getMetadata(EdmType, element);
                let elementTypeName = Reflect.getMetadata(EdmElementType, element, EdmElementType) || Reflect.getMetadata(EdmElementType, element);
                Reflect.defineMetadata(EdmReturnType, elementTypeName ? typeName + "(" + elementTypeName + ")" : typeName, target, targetKey);
            }
            Reflect.defineMetadata(type, type, target, targetKey);
        };
    }
    function ActionImport(returnType) {
        return operationDecoratorFactory(EdmAction);
    }
    Edm.ActionImport = ActionImport;
    function Action(returnType) {
        return operationDecoratorFactory(EdmAction);
    }
    Edm.Action = Action;
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
    function getReturnType(target, propertyKey) {
        return Reflect.getMetadata(EdmReturnType, target.prototype, propertyKey) ||
            Reflect.getMetadata(EdmReturnType, target, propertyKey);
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
    function EntitySet(name) {
        return function (controller) {
            controller.prototype.entitySetName = name;
        };
    }
    Edm.EntitySet = EntitySet;
})(Edm = exports.Edm || (exports.Edm = {}));
//# sourceMappingURL=edm.js.map