import "reflect-metadata";
import * as util from "util";
import { ODataController } from "./controller";
import { ODataServer } from "./server";
import { getFunctionParameters, Decorator } from "./utils";
import * as odata from "./odata";

const EdmProperties:string = "edm:properties";
const EdmKeyProperties:string = "edm:keyproperties";
const EdmKeyProperty:string = "edm:keyproperty";
const EdmForeignKeys:string = "edm:foreignkeys";
const EdmComputedProperty:string = "edm:computedproperty";
const EdmNullableProperty:string = "edm:nullableproperty";
const EdmPartnerProperty:string = "edm:partnerproperty";
const EdmType:string = "edm:type";
const EdmElementType:string = "edm:elementtype";
const EdmComplexType:string = "edm:complextype";
const EdmEntityType:string = "edm:entitytype";
const EdmEnumType:string = "edm:enumtype";
const EdmTypeDefinition:string = "edm:typedefinition";
const EdmFlags:string = "edm:flags";
const EdmOperations:string = "edm:operations";
const EdmAction:string = "edm:action";
const EdmFunction:string = "edm:function";
const EdmReturnType:string = "edm:returntype";
const EdmParameters:string = "edm:parameters";
const EdmAnnotations:string = "edm:annotations";
const EdmConverter:string = "edm:converter";
const EdmSerializer:string = "edm:serializer";
const EdmDeserializer:string = "edm:deserializer";
const EdmURLSerializer:string = "edm:urlserializer";
const EdmURLDeserializer:string = "edm:urldeserializer";
const EdmMediaEntity:string = "edm:mediaentity";
const EdmOpenType:string = "emd:opentype";
const EdmChildren:string = "edm:children";
const EdmContainer:Function[] = [];
const EdmMaxLength:string = "edm:maxlength";
const EdmPrecision:string = "edm:precision";
const EdmScale:string = "edm:scale";
const EdmUnicode:string = "edm:unicode";
const EdmSRID:string = "edm:srid";
const EdmDefaultValue:string = "edm:defaultvalue";
const EdmConcurrencyMode:string = "edm:concurrencymode";

/**
 * Defines OData Edm decorators
 *
 * @param type Edm decorator type
 * @return     Edm decorator
 */
function typeDecoratorFactory(type:string):any{
    let decorator = function(target?:any, targetKey?:string, parameterIndex?:number){
        let baseType = Object.getPrototypeOf(target).constructor;
        if (baseType != Object && getProperties(baseType.prototype).length > 0){
            EntityType()(baseType.prototype);
            let children = Reflect.getOwnMetadata(EdmChildren, baseType) || [];
            if (children.indexOf(target.constructor) < 0){
                children.unshift(target.constructor);
            }
            Reflect.defineMetadata(EdmChildren, children, baseType);
        }
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.type = type;
            }else{
                existingParameters.push({
                    name: paramName,
                    type: type
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            let desc = Object.getOwnPropertyDescriptor(target, targetKey);
            if (targetKey != EdmType && ((desc && typeof desc.value != "function") || (!desc && typeof target[targetKey] != "function"))) {
                let properties:string[] = Reflect.getOwnMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        }
    };

    return function(this:any, ...args:any[]){
        if (arguments.length == 0) return decorator;
        else return decorator.apply(this, args);
    };
}
/** Edm.Binary primitive type property decorator */
export const Binary = typeDecoratorFactory("Edm.Binary");
/** Edm.Boolean primitive type property decorator */
export const Boolean = typeDecoratorFactory("Edm.Boolean");
/** Edm.Byte primitive type property decorator */
export const Byte = typeDecoratorFactory("Edm.Byte");
/** Edm.Date primitive type property decorator */
export const Date = typeDecoratorFactory("Edm.Date");
/** Edm.DateTimeOffset primitive type property decorator */
export const DateTimeOffset = typeDecoratorFactory("Edm.DateTimeOffset");
/** Edm.Decimal primitive type property decorator */
export const Decimal = typeDecoratorFactory("Edm.Decimal");
/** Edm.Double primitive type property decorator */
export const Double = typeDecoratorFactory("Edm.Double");
/** Edm.Duration primitive type property decorator */
export const Duration = typeDecoratorFactory("Edm.Duration");
/** Edm.Guid primitive type property decorator */
export const Guid = typeDecoratorFactory("Edm.Guid");
/** Edm.Int16 primitive type property decorator */
export const Int16 = typeDecoratorFactory("Edm.Int16");
/** Edm.Int32 primitive type property decorator */
export const Int32 = typeDecoratorFactory("Edm.Int32");
/** Edm.Int64 primitive type property decorator */
export const Int64 = typeDecoratorFactory("Edm.Int64");
/** Edm.SByte primitive type property decorator */
export const SByte = typeDecoratorFactory("Edm.SByte");
/** Edm.Single primitive type property decorator */
export const Single = typeDecoratorFactory("Edm.Single");
/** Edm.Stream primitive type property decorator */
export function Stream(contentType?:string);
export function Stream(target?:any, targetKey?:string);
export function Stream(this:any, target?:any){
    if (typeof target == "string"){
        const contentType = target;
        return function(target, targetKey){
            Reflect.defineMetadata(EdmMediaEntity, contentType, target, targetKey);
            typeDecoratorFactory("Edm.Stream")(target, targetKey);
        }
    }
    return typeDecoratorFactory("Edm.Stream").apply(this, arguments);
};
/** Edm.String primitive type property decorator */
export const String = typeDecoratorFactory("Edm.String");
/** Edm.TimeOfDay primitive type property decorator */
export const TimeOfDay = typeDecoratorFactory("Edm.TimeOfDay");
/** Edm.Geography primitive type property decorator */
export const Geography = typeDecoratorFactory("Edm.Geography");
/** Edm.GeographyPoint primitive type property decorator */
export const GeographyPoint = typeDecoratorFactory("Edm.GeographyPoint");
/** Edm.GeographyLineString primitive type property decorator */
export const GeographyLineString = typeDecoratorFactory("Edm.GeographyLineString");
/** Edm.GeographyPolygon primitive type property decorator */
export const GeographyPolygon = typeDecoratorFactory("Edm.GeographyPolygon");
/** Edm.GeographyMultiPoint primitive type property decorator */
export const GeographyMultiPoint = typeDecoratorFactory("Edm.GeographyMultiPoint");
/** Edm.GeographyMultiLineString primitive type property decorator */
export const GeographyMultiLineString = typeDecoratorFactory("Edm.GeographyMultiLineString");
/** Edm.GeographyMultiPolygon primitive type property decorator */
export const GeographyMultiPolygon = typeDecoratorFactory("Edm.GeographyMultiPolygon");
/** Edm.GeographyCollection primitive type property decorator */
export const GeographyCollection = (function GeographyCollection(){
    return typeDecoratorFactory("Edm.GeographyCollection");
})();
/** Edm.Geometry primitive type property decorator */
export const Geometry = (function Geometry(){
    return typeDecoratorFactory("Edm.Geometry");
})();
/** Edm.GeometryPoint primitive type property decorator */
export const GeometryPoint = (function GeometryPoint(){
    return typeDecoratorFactory("Edm.GeometryPoint");
})();
/** Edm.GeometryLineString primitive type property decorator */
export const GeometryLineString = (function GeometryLineString(){
    return typeDecoratorFactory("Edm.GeometryLineString");
})();
/** Edm.GeometryPolygon primitive type property decorator */
export const GeometryPolygon = (function GeometryPolygon(){
    return typeDecoratorFactory("Edm.GeometryPolygon");
})();
/** Edm.GeometryMultiPoint primitive type property decorator */
export const GeometryMultiPoint = (function GeometryMultiPoint(){
    return typeDecoratorFactory("Edm.GeometryMultiPoint");
})();
/** Edm.GeometryMultiLineString primitive type property decorator */
export const GeometryMultiLineString = (function GeometryMultiLineString(){
    return typeDecoratorFactory("Edm.GeometryMultiLineString");
})();
/** Edm.GeometryMultiPolygon primitive type property decorator */
export const GeometryMultiPolygon = (function GeometryMultiPolygon(){
    return typeDecoratorFactory("Edm.GeometryMultiPolygon");
})();
/** Edm.GeometryCollection primitive type property decorator */
export const GeometryCollection = (function GeometryCollection(){
    return typeDecoratorFactory("Edm.GeometryCollection");
})();
/** ?????????? */
/** Edm.Collection decorator for describing properties as collections */
export function Collection(elementType:Function):Decorator{
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let element = function Collection(){};
            Reflect.decorate([elementType()], element, EdmType);
            let elementTypeName = Reflect.getMetadata(EdmType, element, EdmType);
            if (typeof elementTypeName == "function"){
                elementTypeName = ((<any>elementTypeName).namespace || (<any>target).namespace) + "." + (<any>elementTypeName).name;
            }
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.type = "Collection(" + elementTypeName + ")";
            }else{
                existingParameters.push({
                    name: paramName,
                    type: "Collection(" + elementTypeName + ")"
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            let baseType = Object.getPrototypeOf(target).constructor;
            if (baseType != Object && getProperties(baseType.prototype).length > 0){
                EntityType()(baseType.prototype);
                let children = Reflect.getOwnMetadata(EdmChildren, baseType) || [];
                if (children.indexOf(target.constructor) < 0){
                    children.unshift(target.constructor);
                }
                Reflect.defineMetadata(EdmChildren, children, baseType);
            }
            let desc = Object.getOwnPropertyDescriptor(target, targetKey);
            if ((desc && typeof desc.value != "function") || (!desc && typeof target[targetKey] != "function")) {
                let properties:string[] = Reflect.getOwnMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            let element = function Collection(){};
            try{
                Reflect.decorate([elementType()], element, EdmType);
            }catch(err){
                Reflect.decorate([<any>elementType], element, EdmType);
            }
            let type = Reflect.getMetadata(EdmComplexType, element, EdmType);
            let elementTypeName = Reflect.getMetadata(EdmType, element, EdmType);
            Reflect.defineMetadata(EdmType, "Collection", target, targetKey);
            Reflect.defineMetadata(EdmElementType, elementTypeName, target, targetKey);
            if (type){
                Reflect.defineMetadata(EdmComplexType, type, target, targetKey);
            }else{
                type = Reflect.getMetadata(EdmEntityType, element, EdmType);
                Reflect.defineMetadata(EdmEntityType, type, target, targetKey);
            }
        }
    };
}
/** ?????????? */
export function getTypeName(target:Function, propertyKey:string, container?: ContainerBase):string{
    let type = Reflect.getMetadata(EdmType, target) || Reflect.getMetadata(EdmType, target.prototype, propertyKey) || Reflect.getMetadata(EdmType, target.prototype);
    let elementType = Reflect.getMetadata(EdmElementType, target) || Reflect.getMetadata(EdmElementType, target.prototype, propertyKey) || Reflect.getMetadata(EdmElementType, target.prototype);
    type = (type && type["@odata.type"]) || (type && type.prototype && type.prototype["@odata.type"]) || type;
    if (container && container instanceof ContainerBase){
        let containerType = container.resolve(type);
        if (containerType){
            const containerPrototype = Object.getPrototypeOf(container);
            let namespace = odata.getNamespace(containerPrototype.constructor, containerType) || (<any>(containerPrototype.constructor || target)).namespace || "Default";
            if (containerType.indexOf(".") > 0){
                namespace = containerType.slice(0, containerType.lastIndexOf("."));
                containerType = containerType.slice(containerType.lastIndexOf(".") + 1);
            }
            type = namespace + "." + containerType;
        }
    }
    if (typeof type == "string" && type != "Collection" && type.indexOf(".") < 0){
        for (let i = 0; i < EdmContainer.length; i++) {
            let containerType = EdmContainer[i];
            let namespace = (<any>containerType).namespace || (<any>target).namespace || "Default";
            let containerTypeName = (<any>containerType).name;
            if (containerTypeName == type) {
                type = namespace + "." + type;
                break;
            }
        }
    }else if (typeof type == "function"){
        if (type.__forward__ref__){
            type = ((<any>type).namespace || (<any>target).namespace || "Default") + "." + (<any>type)().name;
        }else type = ((<any>type).namespace || (<any>target).namespace || "Default") + "." + (<any>type).name;
    }
    if (typeof elementType == "string" && elementType != "Collection" && elementType.indexOf(".") < 0) {
        for (let i = 0; i < EdmContainer.length; i++) {
            let containerType = EdmContainer[i];
            let namespace = (<any>containerType).namespace || (<any>target).namespace || "Default";
            let containerTypeName = (<any>containerType).name;
            if (containerTypeName == elementType) {
                elementType = namespace + "." + elementType;
                break;
            }
        }
    } else if (typeof elementType == "string" && elementType == "Collection") {
        // ?
    } else if (typeof elementType == "function") {
        if (elementType.__forward__ref__){
            elementType = ((<any>elementType).namespace || (<any>target).namespace || "Default") + "." + (<any>elementType)().name;
        }else elementType = ((<any>elementType).namespace || (<any>target).namespace || "Default") + "." + (<any>elementType).name;
    }
    return elementType ? type + "(" + elementType + ")" : type;
}
/** ?????????? */
export function getType(target:Function, propertyKey:string, container?: ContainerBase):Function | string{
    let type = !propertyKey ? Reflect.getMetadata(EdmType, target) : Reflect.getMetadata(EdmType, target.prototype, propertyKey);
    let elementType = !propertyKey ? Reflect.getMetadata(EdmElementType, target) : Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
    let hasEntityType = isEntityType(target, propertyKey) || isComplexType(target, propertyKey);
    if (!elementType) elementType = type;
    if (elementType && elementType.__forward__ref__) elementType = elementType();
    if (type && type.__forward__ref__) type = type();
    if (hasEntityType){
        if (typeof elementType == "string" && elementType.indexOf(".") < 0) elementType = ((<any>target).namespace || "Default") + "." + elementType;
        if (typeof type == "string" && type.indexOf(".") < 0) type = ((<any>target).namespace || "Default") + "." + type;
    }
    if (typeof elementType == "string"){
        if (container && container instanceof ContainerBase){
            let containerType = container.resolve(type);
            if (containerType){
                let namespace = (<any>containerType).namespace || Object.getPrototypeOf(container).constructor.namespace || (<any>target).namespace || "Default";
                let containerTypeName = (<any>containerType).name;
                type = namespace + "." + containerTypeName;
            }
        }
        for (let i = 0; i < EdmContainer.length; i++){
            let containerType = EdmContainer[i];
            let namespace = (<any>containerType).namespace || (<any>target).namespace || "Default";
            let containerTypeName = (namespace ? namespace + "." : "") + (<any>containerType).name;
            if (containerTypeName == elementType){
                return containerType;
            }
        }
    }
    return elementType;
}
/** Returns true if property is a collection (decorated by Edm.Collection) */
export function isCollection(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmType, target.prototype, propertyKey) == "Collection";
}
/** ?????????? */
export function getProperties(target:Function):string[]{
    try{
        return Reflect.getOwnMetadata(EdmProperties, target) || [];
    }catch(err){
        return [];
    }
}
/** ?????????? */
export function getParameters(target:Function, targetKey:string):any[]{
    let params = [];
    let __proto__ = target.prototype;
    while (__proto__){
        params.push(...(Reflect.getOwnMetadata(EdmParameters, __proto__, targetKey) || []));
        __proto__ = Object.getPrototypeOf(__proto__);
    }
    return params;
}
export function getChildren(target:Function){
    return Reflect.getOwnMetadata(EdmChildren, target) || [];
}

/** Edm.Key decorator for describing properties as keys */
export const Key = (function Key(){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        let properties:string[] = Reflect.getOwnMetadata(EdmKeyProperties, target) || [];
        if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
        Reflect.defineMetadata(EdmKeyProperties, properties, target);
        Reflect.defineMetadata(EdmKeyProperty, true, target, targetKey);
    };
})();
/** Returns true if property is a key (decorated by Edm.Key) */
export function isKey(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmKeyProperty, target.prototype, propertyKey) || false;
}
/** Returns property names that build up the key (names of properties decorated by Edm.Key) */
export function getKeyProperties(target:Function):string[]{
    return Reflect.getOwnMetadata(EdmKeyProperties, target) || Reflect.getOwnMetadata(EdmKeyProperties, target.prototype) || [];
}

/**
 * Returns escaped strings according to the OData format
 * Strings are quoted in single quotes therefore single quotes in strings are converted to two singlequotes.
 * Binary values are converted to hexadecimal strings.
 *
 * @param value Input value of any type
 * @param type  OData type of the provided value
 * @return      Escaped string
 */
export async function escape(value:any, type:any, serializer?:Function){
    if (typeof serializer == "function") return await serializer(value);
    if (typeof value == "undefined" || value == null) return value;
    switch (type){
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
        default:
            return `'${value.toString()}'`;
    }
}

/** Edm.Computed decorator for describing computed properties */
export const Computed = (function Computed(){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        Reflect.defineMetadata(EdmComputedProperty, true, target, targetKey);
    };
})();
/** Returns true if property is computed (decorated by Edm.Computed) */
export function isComputed(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmComputedProperty, target.prototype, propertyKey) || false;
}

/** Edm.Nullable decorator for describing nullable properties (which can be missing) */
export const Nullable = (function Nullable(){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.nullable = true;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    nullable: true
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmNullableProperty, true, target, targetKey);
        }
    }
})();
/** Returns true if property is nullable (decorated by Edm.Nullable) */
export function isNullable(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey);
}

/** Edm.Required decorator for describing non-nullable properties that must have value (cannot be missing) */
export const Required = (function Required(){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.nullable = false;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    nullable: false
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmNullableProperty, false, target, targetKey);
        }
    }
})();
/** Returns true if property is required (decorated by Edm.Required) */
export function isRequired(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey) == false ? true : false;
}

/** Edm.MaxLength decorator to set property max length */
export function MaxLength(maxLength: number){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.maxLength = maxLength;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    maxLength
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmMaxLength, maxLength, target, targetKey);
        }
    };
}
/** Returns property max length (decorated by Edm.MaxLength) */
export function getMaxLength(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmMaxLength, target.prototype, propertyKey);
}

/** Edm.Precision decorator to set property precision */
export function Precision(precision: number){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.precision = precision;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    precision
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmPrecision, precision, target, targetKey);
        }
    };
}
/** Returns property precision (decorated by Edm.Precision) */
export function getPrecision(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmPrecision, target.prototype, propertyKey);
}

/** Edm.Scale decorator to set property scale */
export function Scale(scale: number){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.scale = scale;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    scale
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmScale, scale, target, targetKey);
        }
    };
}
/** Returns property scale (decorated by Edm.Scale) */
export function getScale(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmScale, target.prototype, propertyKey);
}

/** Edm.Unicode decorator for describing unicode properties */
export const Unicode = (function Unicode(){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.unicode = true;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    unicode: true
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmUnicode, true, target, targetKey);
        }
    };
})();
/** Returns true if property is unicode (decorated by Edm.Unicode) */
export function isUnicode(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmUnicode, target.prototype, propertyKey);
}

/** Edm.SRID decorator to set property SRID */
export function SRID(srid: number){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.srid = srid;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    SRID: srid
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmSRID, srid, target, targetKey);
        }
    };
}
/** Returns property SRID (decorated by Edm.SRID) */
export function getSRID(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmSRID, target.prototype, propertyKey);
}

/** Edm.DefaultValue decorator to set property default value */
export function DefaultValue(value: any){
    return function(target, targetKey, parameterIndex?:number){
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.defaultValue = value;
            }else{
                existingParameters.push({
                    name: parameterNames[parameterIndex],
                    defaultValue: value
                });
            }
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            Reflect.defineMetadata(EdmDefaultValue, value, target, targetKey);
        }
    };
}
/** Returns property default value (decorated by Edm.DefaultValue) */
export function getDefaultValue(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmDefaultValue, target.prototype, propertyKey);
}

/** Edm.ConcurrencyMode decorator to set property concurrency mode */
export function ConcurrencyMode(mode: string){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        Reflect.defineMetadata(EdmConcurrencyMode, mode, target, targetKey);
    };
}
/** Returns property concurrency mode (decorated by Edm.ConcurrencyMode) */
export function getConcurrencyMode(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmConcurrencyMode, target.prototype, propertyKey);
}

function operationDecoratorFactory(type, returnType?){
    return function(target, targetKey){
        let element = function(){};
        (<any>element).target = target;
        (<any>element).targetKey = targetKey;
        if (typeof returnType == "function"){
            try {
                Reflect.decorate([returnType()], element.prototype, EdmReturnType);
            }
            catch (err) {
                returnType(element.prototype, EdmReturnType);
            }
        }
        let existingOperations:any[] = Reflect.getOwnMetadata(EdmOperations, target) || [];
        existingOperations.push(targetKey);
        Reflect.defineMetadata(EdmOperations, existingOperations, target);
        Reflect.defineMetadata(type, type, target, targetKey);
        Reflect.defineMetadata(EdmReturnType, element, target, targetKey);
    };
}
/** Edm.ActionImport decorator for describing unbound actions callable from the service root */
export function ActionImport();
export function ActionImport(returnType?:any);
export function ActionImport(target?:any, targetKey?:string);
export function ActionImport(target?:any, targetKey?:string){
    if (arguments.length > 1) return operationDecoratorFactory(EdmAction)(target, targetKey);
    else return operationDecoratorFactory(EdmAction, target);
}
/** Edm.Action decorator for describing actions */
export function _Action();
export function _Action(returnType?:any);
export function _Action(target?:any, targetKey?:string);
export function _Action(target?:any, targetKey?:string){
    if (arguments.length > 1) return operationDecoratorFactory(EdmAction)(target, targetKey);
    else return operationDecoratorFactory(EdmAction, target);
}
export const Action = _Action;
/** ?????????? */
/** Edm.FunctionImport decorator for describing unbound actions callable from the service root */
export function FunctionImport();
export function FunctionImport(returnType?:any);
export function FunctionImport(target?:any, targetKey?:string);
export function FunctionImport(target?:any, targetKey?:string){
    if (arguments.length > 1) return operationDecoratorFactory(EdmFunction)(target, targetKey);
    else return operationDecoratorFactory(EdmFunction, target);
}

/** ?????????? */
/** Edm.Function decorator for describing actions */
export function _Function();
export function _Function(returnType?:any);
export function _Function(target?:any, targetKey?:string);
export function _Function(target?:any, targetKey?:string){
    if (arguments.length > 1) return operationDecoratorFactory(EdmFunction)(target, targetKey);
    else return operationDecoratorFactory(EdmFunction, target);
}
export const Function = _Function;

/** ?????????? */
export function getOperations(target:Function):string[]{
    return Reflect.getOwnMetadata(EdmOperations, target.prototype) || [];
}

/** ?????????? */
export function getReturnTypeName(target:Function, propertyKey:string, container?:ContainerBase):string{
    let returnType = Reflect.getMetadata(EdmReturnType, target.prototype, propertyKey);
    return getTypeName(returnType, EdmReturnType, container) || getTypeName(target, propertyKey, container);
}
/** ?????????? */
export function getReturnType(target:Function, propertyKey:string, container?:ContainerBase):Function | string{
    let returnType = Reflect.getMetadata(EdmReturnType, target.prototype, propertyKey);
    return getType(returnType, EdmReturnType, container) || getType(target, propertyKey, container);
}

/** Returns true if property is a statically callable action (decorated by Edm.ActionImport) */
export function isActionImport(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmAction, target.prototype, propertyKey) || false;
}
/** Returns true if property is a statically callable function (decorated by Edm.FunctionImport) */
export function isFunctionImport(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmFunction, target.prototype, propertyKey) || false;
}
/** Returns true if property is an action (decorated by Edm.Action) */
export function isAction(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmAction, target.prototype, propertyKey) || false;
}
/** Returns true if property is an function (decorated by Edm.Function) */
export function isFunction(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmFunction, target.prototype, propertyKey) || false;
}

/** Edm.ComplexType decorator for describing properties of complex types */
export function ComplexType(type?:Function | string){
    return function(target:any, targetKey?:string, parameterIndex?:any){
        if (type && (<any>type).__forward__ref__) type = (<any>type)();
        let baseType = Object.getPrototypeOf(target).constructor;
        if (baseType != Object && getProperties(baseType.prototype).length > 0){
            ComplexType()(baseType.prototype);
            let children = Reflect.getOwnMetadata(EdmChildren, baseType) || [];
            if (children.indexOf(target.constructor) < 0){
                children.unshift(target.constructor);
            }
            Reflect.defineMetadata(EdmChildren, children, baseType);
        }
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.type = type;
            }else{
                existingParameters.push(param = {
                    name: paramName,
                    type: type
                });
            }
            Reflect.defineMetadata(EdmComplexType, true, param.type);
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            let desc = Object.getOwnPropertyDescriptor(target, targetKey);
            if (targetKey && targetKey != EdmType && ((desc && typeof desc.value != "function") || (!desc && typeof target[targetKey] != "function"))) {
                let properties:string[] = Reflect.getOwnMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            if (type) Reflect.defineMetadata(EdmComplexType, true, type);
            Reflect.defineMetadata(EdmComplexType, type || true, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        }
    };
}
/** Returns true if property is a complex type (decorated by Edm.ComplexType) */
export function isComplexType(target:Function, propertyKey?:string):boolean{
    return typeof propertyKey == "string" 
        ? Reflect.hasMetadata(EdmComplexType, target.prototype, propertyKey)
        : Reflect.hasMetadata(EdmComplexType, target);
}

/** Edm.MediaEntity decorator for describing media entity properties */
export function MediaEntity(contentType:string){
    return Reflect.metadata(EdmMediaEntity, contentType);
}
/** Returns true if property is a media entity (decorated by Edm.MediaEntity) */
export function isMediaEntity(target:Function){
    return Reflect.hasMetadata(EdmMediaEntity, target);
}
/** ?????????? */
export function getContentType(target:Function, targetKey?:string){
    return Reflect.getMetadata(EdmMediaEntity, target, targetKey);
}

/** Edm.OpenType decorator for describing open type properties */
export const OpenType = (function OpenType(){
    return Reflect.metadata(EdmOpenType, true);
})();
/** Returns true if property is a open type (decorated by Edm.OpenType) */
export function isOpenType(target:Function){
    return Reflect.hasMetadata(EdmOpenType, target) || false;
}

/** ?????????? */
/** Edm.EntityType decorator for describing entity types */
export function EntityType(type?:Function | string){
    return function(target:any, targetKey?:string, parameterIndex?:any){
        let baseType = Object.getPrototypeOf(target).constructor;
        if (baseType != Object && getProperties(baseType.prototype).length > 0){
            EntityType()(baseType.prototype);
            let children = Reflect.getOwnMetadata(EdmChildren, baseType) || [];
            if (children.indexOf(target.constructor) < 0){
                children.unshift(target.constructor);
            }
            Reflect.defineMetadata(EdmChildren, children, baseType);
        }
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.type = type;
            }else{
                existingParameters.push(param = {
                    name: paramName,
                    type: type
                });
            }
            Reflect.defineMetadata(EdmEntityType, true, param.type);
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            let desc = Object.getOwnPropertyDescriptor(target, targetKey);
            if (targetKey && targetKey != EdmType && ((desc && typeof desc.value != "function") || (!desc && typeof target[targetKey] != "function"))) {
                let properties:string[] = Reflect.getOwnMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            if (type) Reflect.defineMetadata(EdmEntityType, true, type);
            Reflect.defineMetadata(EdmEntityType, type || true, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        }
    };
}
/** Returns true if property is an EntityType (decorated by Edm.EntityType) */
export function isEntityType(target:Function, propertyKey?:string):boolean{
    return typeof propertyKey == "string" 
        ? !Reflect.hasMetadata(EdmComplexType, target.prototype, propertyKey) && Reflect.hasMetadata(EdmEntityType, target.prototype, propertyKey)
        : !Reflect.hasMetadata(EdmComplexType, target) && Reflect.hasMetadata(EdmEntityType, target);
}

export function Flags(target, targetKey){
    Reflect.defineMetadata(EdmFlags, true, target, targetKey);
}
export function isFlags(target:Function, propertyKey:string):boolean{
    return Reflect.getMetadata(EdmFlags, target.prototype, propertyKey);
}
export function EnumType(type:any):Decorator{
    return function(target:any, targetKey?:string, parameterIndex?:number):any{
        let baseType = Object.getPrototypeOf(target).constructor;
        if (baseType != Object && getProperties(baseType.prototype).length > 0){
            EntityType()(baseType.prototype);
            let children = Reflect.getOwnMetadata(EdmChildren, baseType) || [];
            if (children.indexOf(target.constructor) < 0){
                children.unshift(target.constructor);
            }
            Reflect.defineMetadata(EdmChildren, children, baseType);
        }
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.type = type;
            }else{
                existingParameters.push(param = {
                    name: paramName,
                    type: type
                });
            }
            Reflect.defineMetadata(EdmEnumType, true, param.type);
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            let desc = Object.getOwnPropertyDescriptor(target, targetKey);
            if (targetKey && targetKey != EdmType && ((desc && typeof desc.value != "function") || (!desc && typeof target[targetKey] != "function"))) {
                let properties:string[] = Reflect.getOwnMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            Reflect.defineMetadata(EdmEnumType, true, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        }
    }
}
export function isEnumType(target:any, propertyKey?:string):boolean{
    return typeof propertyKey == "string"
        ? Reflect.hasMetadata(EdmEnumType, target.prototype, propertyKey)
        : Reflect.hasMetadata(EdmEnumType, target);
}

export function TypeDefinition(type){
    return function(target, targetKey?, parameterIndex?){
        let baseType = Object.getPrototypeOf(target).constructor;
        if (baseType != Object && getProperties(baseType.prototype).length > 0){
            EntityType()(baseType.prototype);
            let children = Reflect.getOwnMetadata(EdmChildren, baseType) || [];
            if (children.indexOf(target.constructor) < 0){
                children.unshift(target.constructor);
            }
            Reflect.defineMetadata(EdmChildren, children, baseType);
        }
        if (typeof parameterIndex == "number"){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(EdmParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            let param:any = existingParameters.filter(p => p.name == paramName)[0];
            if (param){
                param.type = type;
            }else{
                existingParameters.push(param = {
                    name: paramName,
                    type: type
                });
            }
            Reflect.defineMetadata(EdmTypeDefinition, true, param.type);
            Reflect.defineMetadata(EdmParameters, existingParameters, target, targetKey);
        }else{
            if (typeof target == "function"){
                register(target);
            }
            let desc = Object.getOwnPropertyDescriptor(target, targetKey);
            if (targetKey && targetKey != EdmType && ((desc && typeof desc.value != "function") || (!desc && typeof target[targetKey] != "function"))) {
                let properties:string[] = Reflect.getOwnMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            Reflect.defineMetadata(EdmTypeDefinition, true, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        }
    };
}
export function isTypeDefinition(target:any, propertyKey?:string):boolean{
    return typeof propertyKey == "string"
        ? Reflect.hasMetadata(EdmTypeDefinition, target.prototype, propertyKey)
        : Reflect.hasMetadata(EdmTypeDefinition, target);
}

/** ?????????? */
export function register(type:Function){
    if (EdmContainer.indexOf(type) < 0) EdmContainer.push(type);
}

/** ?????????? */
export function Convert(converter:Function){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        Reflect.defineMetadata(EdmConverter, converter, target, targetKey);
    };
}
/** ?????????? */
export function getConverter(target:Function, propertyKey:string):Function{
    return Reflect.getMetadata(EdmConverter, target.prototype, propertyKey);
}

/** ?????????? */
export function Serialize(converter:Function){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        Reflect.defineMetadata(EdmSerializer, converter, target, targetKey);
    };
}
/** ?????????? */
export function getSerializer(target:Function, propertyKey:string, type?: any, container?: ContainerBase):Function{
    return Reflect.getMetadata(EdmSerializer, target.prototype, propertyKey) ||
        (type && container && Reflect.getMetadata(EdmSerializer, Object.getPrototypeOf(container), container.resolve(type)));
}

/** ?????????? */
export function Deserialize(converter:Function){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        Reflect.defineMetadata(EdmDeserializer, converter, target, targetKey);
    };
}
/** ?????????? */
export function getDeserializer(target:Function, propertyKey:string, type?: any, container?: ContainerBase):Function{
    return Reflect.getMetadata(EdmDeserializer, target.prototype, propertyKey) ||
        (type && container && Reflect.getMetadata(EdmDeserializer, Object.getPrototypeOf(container), container.resolve(type)));
}

/** ?????????? */
export function URLSerialize(converter:Function){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        Reflect.defineMetadata(EdmURLSerializer, converter, target, targetKey);
    };
}
/** ?????????? */
export function getURLSerializer(target:Function, propertyKey:string, type?: any, container?: ContainerBase):Function{
    return Reflect.getMetadata(EdmURLSerializer, target.prototype, propertyKey) ||
        (type && container && Reflect.getMetadata(EdmURLSerializer, Object.getPrototypeOf(container), container.resolve(type)));
}

/** ?????????? */
export function URLDeserialize(converter:Function){
    return function(target, targetKey){
        if (typeof target == "function"){
            register(target);
        }
        Reflect.defineMetadata(EdmURLDeserializer, converter, target, targetKey);
    };
}
/** ?????????? */
export function getURLDeserializer(target:Function, propertyKey:string, type?: any, container?: ContainerBase):Function{
    return Reflect.getMetadata(EdmURLDeserializer, target.prototype, propertyKey) ||
        (type && container && Reflect.getMetadata(EdmURLDeserializer, Object.getPrototypeOf(container), container.resolve(type)));
}

/** ?????????? */
export function Annotate(...annotation:any[]){
    return function(target:any, targetKey?:string){
        if (typeof target == "function"){
            register(target);
        }
        let existingAnnotations:any[] = Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
        existingAnnotations = annotation.concat(existingAnnotations);
        Reflect.defineMetadata(EdmAnnotations, existingAnnotations, target, targetKey);
    };
}
/** ?????????? */
export function getAnnotations(target:Function, targetKey?:string):any[]{
    try{
        return Reflect.getOwnMetadata(EdmAnnotations, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
    }catch{
        return Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
    }
}

/** ?????????? */
/** Edm.ForeignKey decorator for describing properties as foreign keys */
export function ForeignKey(...keys:string[]){
    return function(target:any, targetKey?:string){
        if (typeof target == "function"){
            register(target);
        }
        let existingForeignKeys:any[] = Reflect.getOwnMetadata(EdmForeignKeys, target, targetKey) || [];
        existingForeignKeys = keys.concat(existingForeignKeys);
        Reflect.defineMetadata(EdmForeignKeys, existingForeignKeys, target, targetKey);
    };
}
/** ?????????? */
/** Edm.ForeignKey decorator for describing properties as foreign keys */
export function getForeignKeys(target:Function, targetKey?:string):string[]{
    return Reflect.getOwnMetadata(EdmForeignKeys, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmForeignKeys, target, targetKey) || [];
}

/** ?????????? */
/** Returns property names that are foreign keys (names of properties decorated by Edm.ForeignKey) */
export function Partner(property:string){
    return Reflect.metadata(EdmPartnerProperty, property);
}
/** ?????????? */
export function getPartner(target:any, targetKey:string){
    return Reflect.getMetadata(EdmPartnerProperty, target, targetKey) || Reflect.getMetadata(EdmPartnerProperty, target.prototype, targetKey);
}

/** ?????????? */
/** Edm.EntitySet decorator for describing entity sets */
export function EntitySet(name:string){
    return function(controller:typeof ODataController){
        controller.prototype.entitySetName = name;
    };
}

/** Helper function to use references declared later
 * @param forwardRefFn a function returning the reference
 */
export function ForwardRef(forwardRefFn:Function){
    const fwd = function(){
        return forwardRefFn();
    };
    (<any>fwd).__forward__ref__ = true;
    return fwd;
}

export interface IEdmContainerInstance{
    resolve(type);
}
export interface IEdmContainer{
    namespace:string
    new(server?:typeof ODataServer):IEdmContainerInstance
}
export function Container(type:IEdmContainer);
export function Container(type:Function);
export function Container(type:any){
    return function(server:typeof ODataServer){
        if (!(type.prototype instanceof ContainerBase)){
            util.inherits(type, ContainerBase);
        }
        server.container = new type(server);
    };
}
export const EdmContainerClass = <IEdmContainer>class{
    constructor(_?:typeof ODataServer){}
    resolve(type):string{
        for (let prop in this){
            if (this[prop] == type) return prop;
        }
        return null;
    }
}
export class ContainerBase extends EdmContainerClass{}