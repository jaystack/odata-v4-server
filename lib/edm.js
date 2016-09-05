"use strict";
require("reflect-metadata");
var utils_1 = require("./utils");
var Entity = (function () {
    function Entity(entity) {
        var _this = this;
        var proto = Object.getPrototypeOf(this);
        Edm.getProperties(proto).forEach(function (prop) {
            var type = Edm.getType(proto.constructor, prop);
            var converter = Edm.getConverter(proto.constructor, prop);
            var isCollection = Edm.isCollection(proto.constructor, prop);
            if (isCollection && entity[prop]) {
                var value = Array.isArray(entity[prop]) ? entity[prop] : [entity[prop]];
                if (typeof type == "function")
                    _this[prop] = value.map(function (it) { return new type(it); });
                else if (typeof converter == "function")
                    _this[prop] = value.map(function (it) { return converter(it); });
                else
                    _this[prop] = value;
            }
            else {
                if (typeof type == "function" && entity[prop])
                    _this[prop] = new type(entity[prop]);
                else if (typeof converter == "function")
                    _this[prop] = converter(entity[prop]);
                else
                    _this[prop] = entity[prop];
            }
        });
    }
    return Entity;
}());
exports.Entity = Entity;
var Edm;
(function (Edm) {
    var EdmProperties = "edm:properties";
    var EdmKeyProperty = "edm:keyproperty";
    var EdmComputedProperty = "edm:computedproperty";
    var EdmNullableProperty = "edm:nullableproperty";
    var EdmRequiredProperty = "edm:requiredproperty";
    var EdmType = "edm:type";
    var EdmElementType = "edm:elementtype";
    var EdmComplexType = "edm:complextype";
    var EdmOperations = "edm:operations";
    var EdmAction = "edm:action";
    var EdmFunction = "edm:function";
    var EdmReturnType = "edm:returntype";
    var EdmParameters = "edm:parameters";
    var EdmAnnotations = "edm:annotations";
    var EdmConverter = "edm:converter";
    function typeDecoratorFactory(type) {
        return function (target, targetKey, parameterIndex) {
            if (typeof parameterIndex != "undefined") {
                var parameterNames = utils_1.getFunctionParameters(target, targetKey);
                var existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                var paramName_1 = parameterNames[parameterIndex];
                var param = existingParameters.filter(function (p) { return p.name == paramName_1; })[0];
                if (param) {
                    param.type = type;
                }
                else {
                    existingParameters.push({
                        name: paramName_1,
                        type: type
                    });
                }
                Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
            }
            else {
                if (targetKey != EdmType) {
                    var properties = Reflect.getMetadata(EdmProperties, target) || [];
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
                var parameterNames = utils_1.getFunctionParameters(target, targetKey);
                var existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                var element = function Collection() { };
                Reflect.decorate([elementType()], element, EdmType);
                var elementTypeName = Reflect.getMetadata(EdmType, element, EdmType);
                if (typeof elementTypeName == "function") {
                    elementTypeName = (elementTypeName.namespace || target.namespace) + "." + elementTypeName.name;
                }
                var paramName_2 = parameterNames[parameterIndex];
                var param = existingParameters.filter(function (p) { return p.name == paramName_2; })[0];
                if (param) {
                    param.type = "Collection(" + elementTypeName + ")";
                }
                else {
                    existingParameters.push({
                        name: paramName_2,
                        type: "Collection(" + elementTypeName + ")"
                    });
                }
                Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
            }
            else {
                var properties = Reflect.getMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0)
                    properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
                var element = function Collection() { };
                try {
                    Reflect.decorate([elementType()], element, EdmType);
                }
                catch (err) {
                    Reflect.decorate([elementType], element, EdmType);
                }
                var type = Reflect.getMetadata(EdmComplexType, element, EdmType);
                var elementTypeName = Reflect.getMetadata(EdmType, element, EdmType);
                Reflect.defineMetadata(EdmType, "Collection", target, targetKey);
                Reflect.defineMetadata(EdmElementType, elementTypeName, target, targetKey);
                Reflect.defineMetadata(EdmComplexType, type, target, targetKey);
            }
        };
    }
    Edm.Collection = Collection;
    function getTypeName(target, propertyKey) {
        var type = Reflect.getMetadata(EdmType, target.prototype, propertyKey);
        var elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
        if (typeof type == "function") {
            type = (type.namespace || target.namespace) + "." + type.name;
        }
        if (typeof elementType == "function") {
            elementType = (elementType.namespace || target.namespace) + "." + elementType.name;
        }
        return elementType ? type + "(" + elementType + ")" : type;
    }
    Edm.getTypeName = getTypeName;
    function getType(target, propertyKey) {
        var type = Reflect.getMetadata(EdmType, target.prototype, propertyKey);
        var elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
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
        return Reflect.metadata(EdmKeyProperty, true);
    }
    Edm.Key = Key;
    function isKey(target, propertyKey) {
        return Reflect.getMetadata(EdmKeyProperty, target.prototype, propertyKey) || false;
    }
    Edm.isKey = isKey;
    function Computed() {
        return Reflect.metadata(EdmComputedProperty, true);
    }
    Edm.Computed = Computed;
    function isComputed(target, propertyKey) {
        return Reflect.getMetadata(EdmComputedProperty, target.prototype, propertyKey) || false;
    }
    Edm.isComputed = isComputed;
    function Nullable() {
        return function (target, targetKey, parameterIndex) {
            if (typeof parameterIndex != "undefined") {
                var parameterNames = utils_1.getFunctionParameters(target, targetKey);
                var existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                var paramName_3 = parameterNames[parameterIndex];
                var param = existingParameters.filter(function (p) { return p.name == paramName_3; })[0];
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
            else
                Reflect.defineMetadata(EdmNullableProperty, true, target, targetKey);
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
                var parameterNames = utils_1.getFunctionParameters(target, targetKey);
                var existingParameters = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
                var paramName_4 = parameterNames[parameterIndex];
                var param = existingParameters.filter(function (p) { return p.name == paramName_4; })[0];
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
            else
                Reflect.defineMetadata(EdmNullableProperty, false, target, targetKey);
        };
    }
    Edm.Required = Required;
    function isRequired(target, propertyKey) {
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey) == false ? true : false;
    }
    Edm.isRequired = isRequired;
    function operationDecoratorFactory(type, returnType) {
        return function (target, targetKey) {
            var element = function () { };
            if (typeof returnType != "undefined") {
                try {
                    Reflect.decorate([returnType()], element, EdmType);
                }
                catch (err) {
                    returnType(element);
                }
                var typeName = Reflect.getMetadata(EdmType, element, EdmType) || Reflect.getMetadata(EdmType, element);
                var elementTypeName = Reflect.getMetadata(EdmElementType, element, EdmElementType) || Reflect.getMetadata(EdmElementType, element);
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
            var existingOperations = Reflect.getOwnMetadata(EdmOperations, target) || [];
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
            if (targetKey != EdmType) {
                var properties = Reflect.getMetadata(EdmProperties, target) || [];
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
    function Convert(converter) {
        return Reflect.metadata(EdmConverter, converter);
    }
    Edm.Convert = Convert;
    function getConverter(target, propertyKey) {
        return Reflect.getMetadata(EdmConverter, target.prototype, propertyKey);
    }
    Edm.getConverter = getConverter;
    function Annotate() {
        var annotation = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            annotation[_i - 0] = arguments[_i];
        }
        return function (target, targetKey) {
            var existingAnnotations = Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
            existingAnnotations = annotation.concat(existingAnnotations);
            Reflect.defineMetadata(EdmAnnotations, existingAnnotations, target, targetKey);
        };
    }
    Edm.Annotate = Annotate;
    function getAnnotations(target, targetKey) {
        return Reflect.getOwnMetadata(EdmAnnotations, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
    }
    Edm.getAnnotations = getAnnotations;
})(Edm = exports.Edm || (exports.Edm = {}));
//# sourceMappingURL=edm.js.map