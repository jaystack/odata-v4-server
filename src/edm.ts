import "reflect-metadata";
import { getFunctionParameters } from "./utils";

export class Entity{
    constructor(entity:any){
        let proto = Object.getPrototypeOf(this);
        Edm.getProperties(proto).forEach((prop) => {
            let type:any = Edm.getType(proto.constructor, prop);
            let converter:Function = Edm.getConverter(proto.constructor, prop);
            let isCollection = Edm.isCollection(proto.constructor, prop);
            if (isCollection && entity[prop]){
                let value = Array.isArray(entity[prop]) ? entity[prop] : [entity[prop]];
                if (typeof type == "function") this[prop] = value.map(it => new type(it));
                else if (typeof converter == "function") this[prop] = value.map(it => converter(it));
                else this[prop] = value;
            }else{
                if (typeof type == "function" && entity[prop]) this[prop] = new type(entity[prop]);
                else if (typeof converter == "function") this[prop] = converter(entity[prop]);
                else this[prop] = entity[prop];
            }
        });
    }
}

export namespace Edm{
    const EdmProperties:string = "edm:properties";
    const EdmKeyProperties:string = "edm:keyproperties";
    const EdmKeyProperty:string = "edm:keyproperty";
    const EdmComputedProperty:string = "edm:computedproperty";
    const EdmNullableProperty:string = "edm:nullableproperty";
    const EdmRequiredProperty:string = "edm:requiredproperty";
    const EdmType:string = "edm:type";
    const EdmElementType:string = "edm:elementtype";
    const EdmComplexType:string = "edm:complextype";
    const EdmOperations:string = "edm:operations";
    const EdmAction:string = "edm:action";
    const EdmFunction:string = "edm:function";
    const EdmReturnType:string = "edm:returntype";
    const EdmParameters:string = "edm:parameters";
    const EdmAnnotations:string = "edm:annotations";
    const EdmConverter:string = "edm:converter";

    function typeDecoratorFactory(type:string){
        return function(target, targetKey, parameterIndex?:number){
            if (typeof parameterIndex != "undefined"){
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
                if (targetKey != EdmType){
                    let properties:string[] = Reflect.getMetadata(EdmProperties, target) || [];
                    if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                    Reflect.defineMetadata(EdmProperties, properties, target);
                }
                Reflect.defineMetadata(EdmType, type, target, targetKey);
            }
        };
    }
    export function Binary(){
        return typeDecoratorFactory("Edm.Binary");
    }
    export function Boolean(){
        return typeDecoratorFactory("Edm.Boolean");
    }
    export function Byte(){
        return typeDecoratorFactory("Edm.Byte");
    }
    export function Date(){
        return typeDecoratorFactory("Edm.Date");
    }
    export function DateTimeOffset(){
        return typeDecoratorFactory("Edm.DateTimeOffset");
    }
    export function Decimal(){
        return typeDecoratorFactory("Edm.Decimal");
    }
    export function Double(){
        return typeDecoratorFactory("Edm.Double");
    }
    export function Duration(){
        return typeDecoratorFactory("Edm.Duration");
    }
    export function Guid(){
        return typeDecoratorFactory("Edm.Guid");
    }
    export function Int16(){
        return typeDecoratorFactory("Edm.Int16");
    }
    export function Int32(){
        return typeDecoratorFactory("Edm.Int32");
    }
    export function Int64(){
        return typeDecoratorFactory("Edm.Int64");
    }
    export function SByte(){
        return typeDecoratorFactory("Edm.SByte");
    }
    export function Single(){
        return typeDecoratorFactory("Edm.Single");
    }
    export function Stream(){
        return typeDecoratorFactory("Edm.Stream");
    }
    export function String(){
        return typeDecoratorFactory("Edm.String");
    }
    export function TimeOfDay(){
        return typeDecoratorFactory("Edm.TimeOfDay");
    }
    export function Geography(){
        return typeDecoratorFactory("Edm.Geography");
    }
    export function GeographyPoint(){
        return typeDecoratorFactory("Edm.GeographyPoint");
    }
    export function GeographyLineString(){
        return typeDecoratorFactory("Edm.GeographyLineString");
    }
    export function GeographyPolygon(){
        return typeDecoratorFactory("Edm.GeographyPolygon");
    }
    export function GeographyMultiPoint(){
        return typeDecoratorFactory("Edm.GeographyMultiPoint");
    }
    export function GeographyMultiLineString(){
        return typeDecoratorFactory("Edm.GeographyMultiLineString");
    }
    export function GeographyMultiPolygon(){
        return typeDecoratorFactory("Edm.GeographyMultiPolygon");
    }
    export function GeographyCollection(){
        return typeDecoratorFactory("Edm.GeographyCollection");
    }
    export function Geometry(){
        return typeDecoratorFactory("Edm.Geometry");
    }
    export function GeometryPoint(){
        return typeDecoratorFactory("Edm.GeometryPoint");
    }
    export function GeometryLineString(){
        return typeDecoratorFactory("Edm.GeometryLineString");
    }
    export function GeometryPolygon(){
        return typeDecoratorFactory("Edm.GeometryPolygon");
    }
    export function GeometryMultiPoint(){
        return typeDecoratorFactory("Edm.GeometryMultiPoint");
    }
    export function GeometryMultiLineString(){
        return typeDecoratorFactory("Edm.GeometryMultiLineString");
    }
    export function GeometryMultiPolygon(){
        return typeDecoratorFactory("Edm.GeometryMultiPolygon");
    }
    export function GeometryCollection(){
        return typeDecoratorFactory("Edm.GeometryCollection");
    }
    export function Collection(elementType:Function){
        return function(target, targetKey, parameterIndex?:number){
            if (typeof parameterIndex != "undefined"){
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
                let properties:string[] = Reflect.getMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
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
                Reflect.defineMetadata(EdmComplexType, type, target, targetKey);
            }
        };
    }
    export function getTypeName(target:Function, propertyKey:string):string{
        let type = Reflect.getMetadata(EdmType, target.prototype, propertyKey);
        let elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
        if (typeof type == "function"){
            type = ((<any>type).namespace || (<any>target).namespace) + "." + (<any>type).name;
        }
        if (typeof elementType == "function"){
            elementType = ((<any>elementType).namespace || (<any>target).namespace) + "." + (<any>elementType).name;
        }
        return elementType ? type + "(" + elementType + ")" : type;
    }
    export function getType(target:Function, propertyKey:string):Function{
        let type = Reflect.getMetadata(EdmType, target.prototype, propertyKey);
        let elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
        return elementType || type;
    }
    export function isCollection(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmType, target.prototype, propertyKey) == "Collection";
    }
    export function getProperties(target:Function):string[]{
        return Reflect.getMetadata(EdmProperties, target) || [];
    }
    export function getParameters(target:Function, targetKey:string):any[]{
        return Reflect.getMetadata(EdmParameters, target.prototype, targetKey) || [];
    }

    export function Key(){
        return function(target, targetKey){
            let properties:string[] = Reflect.getMetadata(EdmKeyProperties, target) || [];
            if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
            Reflect.defineMetadata(EdmKeyProperties, properties, target);
            Reflect.defineMetadata(EdmKeyProperty, true, target, targetKey);
        };
    }
    export function isKey(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmKeyProperty, target.prototype, propertyKey) || false;
    }
    export function getKeyProperties(target:Function):string[]{
        return Reflect.getMetadata(EdmKeyProperties, target) || [];
    }

    export function escape(value:any, type:any){
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
        }
    }

    export function Computed(){
        return Reflect.metadata(EdmComputedProperty, true);
    }
    export function isComputed(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmComputedProperty, target.prototype, propertyKey) || false;
    }

    export function Nullable(){
        return function(target, targetKey, parameterIndex?:number){
            if (typeof parameterIndex != "undefined"){
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
            }else Reflect.defineMetadata(EdmNullableProperty, true, target, targetKey);
        }
    }
    export function isNullable(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey);
    }

    export function Required(){
        return function(target, targetKey, parameterIndex?:number){
            if (typeof parameterIndex != "undefined"){
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
            }else Reflect.defineMetadata(EdmNullableProperty, false, target, targetKey);
        }
    }
    export function isRequired(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey) == false ? true : false;
    }

    function operationDecoratorFactory(type, returnType?){
        return function(target, targetKey){
            let element = function(){};
            if (typeof returnType != "undefined"){
                try{
                    Reflect.decorate([returnType()], element, EdmType);
                }catch(err){
                    returnType(element);
                }
                let typeName = Reflect.getMetadata(EdmType, element, EdmType) || Reflect.getMetadata(EdmType, element);
                let elementTypeName = Reflect.getMetadata(EdmElementType, element, EdmElementType) || Reflect.getMetadata(EdmElementType, element);
                Reflect.defineMetadata(EdmReturnType, elementTypeName ? typeName + "(" + elementTypeName + ")" : typeName, target, targetKey);
            }
            Reflect.defineMetadata(type, type, target, targetKey);
        };
    }
    export function ActionImport(returnType?:Function){
        return operationDecoratorFactory(EdmAction);
    }
    export function Action(returnType?:Function){
        return operationDecoratorFactory(EdmAction);
    }
    export function FunctionImport(returnType:Function){
        return operationDecoratorFactory(EdmFunction, returnType);
    }
    export function Function(returnType:Function){
        return function(target, targetKey){
            let existingOperations:any[] = Reflect.getOwnMetadata(EdmOperations, target) || [];
            existingOperations.push(targetKey);
            Reflect.defineMetadata(EdmOperations, existingOperations, target);
            operationDecoratorFactory(EdmFunction, returnType)(target, targetKey);
        };
    }
    export function getOperations(target:Function):string[]{
        return Reflect.getOwnMetadata(EdmOperations, target.prototype) || [];
    }
    export function getReturnType(target:Function, propertyKey:string):string{
        return Reflect.getMetadata(EdmReturnType, target.prototype, propertyKey) ||
            Reflect.getMetadata(EdmReturnType, target, propertyKey);
    }
    export function isActionImport(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmAction, target.prototype, propertyKey) || false;
    }
    export function isFunctionImport(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmFunction, target.prototype, propertyKey) || false;
    }
    export function isAction(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmAction, target.prototype, propertyKey) || false;
    }
    export function isFunction(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmFunction, target.prototype, propertyKey) || false;
    }

    export function ComplexType(type:Function){
        return function(target, targetKey){
            if (targetKey != EdmType){
                let properties:string[] = Reflect.getMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            Reflect.defineMetadata(EdmComplexType, type, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        };
    }
    export function isComplexType(target:Function, propertyKey:string):boolean{
        return Reflect.hasMetadata(EdmComplexType, target.prototype, propertyKey);
    }

    export function Convert(converter:Function){
        return Reflect.metadata(EdmConverter, converter);
    }
    export function getConverter(target:Function, propertyKey:string):Function{
        return Reflect.getMetadata(EdmConverter, target.prototype, propertyKey);
    }

    export function Annotate(...annotation:any[]){
        return function(target:any, targetKey?:string){
            let existingAnnotations:any[] = Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
            existingAnnotations = annotation.concat(existingAnnotations);
            Reflect.defineMetadata(EdmAnnotations, existingAnnotations, target, targetKey);
        };
    }
    export function getAnnotations(target:Function, targetKey?:string):any[]{
        return Reflect.getOwnMetadata(EdmAnnotations, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
    }
}