import "reflect-metadata";
import { ODataController } from "./controller";
import { getFunctionParameters } from "./utils";

export namespace Edm{
    const EdmProperties:string = "edm:properties";
    const EdmKeyProperties:string = "edm:keyproperties";
    const EdmKeyProperty:string = "edm:keyproperty";
    const EdmForeignKeys:string = "edm:foreignkeys";
    const EdmComputedProperty:string = "edm:computedproperty";
    const EdmNullableProperty:string = "edm:nullableproperty";
    const EdmRequiredProperty:string = "edm:requiredproperty";
    const EdmPartnerProperty:string = "edm:partnerproperty";
    const EdmType:string = "edm:type";
    const EdmElementType:string = "edm:elementtype";
    const EdmComplexType:string = "edm:complextype";
    const EdmEntityType:string = "edm:entitytype";
    const EdmOperations:string = "edm:operations";
    const EdmAction:string = "edm:action";
    const EdmFunction:string = "edm:function";
    const EdmReturnType:string = "edm:returntype";
    const EdmParameters:string = "edm:parameters";
    const EdmAnnotations:string = "edm:annotations";
    const EdmConverter:string = "edm:converter";
    const EdmEntitySet:string = "edm:entityset";
    const EdmMediaEntity:string = "edm:mediaentity";
    const EdmOpenType:string = "emd:opentype";
    const EdmContainer:Function[] = [];

    function typeDecoratorFactory(type:string){
        let decorator = function(target, targetKey, parameterIndex?:number){
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
                if (typeof target == "function"){
                    Edm.register(target);
                }
                if (targetKey != EdmType){
                    let properties:string[] = Reflect.getMetadata(EdmProperties, target) || [];
                    if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                    Reflect.defineMetadata(EdmProperties, properties, target);
                }
                Reflect.defineMetadata(EdmType, type, target, targetKey);
            }
        };

        return function(target?:any, targetKey?:string, parameterIndex?:number):any{
            if (arguments.length == 0) return decorator;
            else return decorator(target, targetKey, parameterIndex);
        }
    }
    export const Binary = typeDecoratorFactory("Edm.Binary");
    export const Boolean = typeDecoratorFactory("Edm.Boolean");
    export const Byte = typeDecoratorFactory("Edm.Byte");
    export const Date = typeDecoratorFactory("Edm.Date");
    export const DateTimeOffset = typeDecoratorFactory("Edm.DateTimeOffset");
    export const Decimal = typeDecoratorFactory("Edm.Decimal");
    export const Double = typeDecoratorFactory("Edm.Double");
    export const Duration = typeDecoratorFactory("Edm.Duration");
    export const Guid = typeDecoratorFactory("Edm.Guid");
    export const Int16 = typeDecoratorFactory("Edm.Int16");
    export const Int32 = typeDecoratorFactory("Edm.Int32");
    export const Int64 = typeDecoratorFactory("Edm.Int64");
    export const SByte = typeDecoratorFactory("Edm.SByte");
    export const Single = typeDecoratorFactory("Edm.Single");
    export const Stream = typeDecoratorFactory("Edm.Stream");
    export const String = typeDecoratorFactory("Edm.String");
    export const TimeOfDay = typeDecoratorFactory("Edm.TimeOfDay");
    export const Geography = typeDecoratorFactory("Edm.Geography");
    export const GeographyPoint = typeDecoratorFactory("Edm.GeographyPoint");
    export const GeographyLineString = typeDecoratorFactory("Edm.GeographyLineString");
    export const GeographyPolygon = typeDecoratorFactory("Edm.GeographyPolygon");
    export const GeographyMultiPoint = typeDecoratorFactory("Edm.GeographyMultiPoint");
    export const GeographyMultiLineString = typeDecoratorFactory("Edm.GeographyMultiLineString");
    export const GeographyMultiPolygon = typeDecoratorFactory("Edm.GeographyMultiPolygon");
    export const GeographyCollection = (function GeographyCollection(){
        return typeDecoratorFactory("Edm.GeographyCollection");
    })();
    export const Geometry = (function Geometry(){
        return typeDecoratorFactory("Edm.Geometry");
    })();
    export const GeometryPoint = (function GeometryPoint(){
        return typeDecoratorFactory("Edm.GeometryPoint");
    })();
    export const GeometryLineString = (function GeometryLineString(){
        return typeDecoratorFactory("Edm.GeometryLineString");
    })();
    export const GeometryPolygon = (function GeometryPolygon(){
        return typeDecoratorFactory("Edm.GeometryPolygon");
    })();
    export const GeometryMultiPoint = (function GeometryMultiPoint(){
        return typeDecoratorFactory("Edm.GeometryMultiPoint");
    })();
    export const GeometryMultiLineString = (function GeometryMultiLineString(){
        return typeDecoratorFactory("Edm.GeometryMultiLineString");
    })();
    export const GeometryMultiPolygon = (function GeometryMultiPolygon(){
        return typeDecoratorFactory("Edm.GeometryMultiPolygon");
    })();
    export const GeometryCollection = (function GeometryCollection(){
        return typeDecoratorFactory("Edm.GeometryCollection");
    })();
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
                if (typeof target == "function"){
                    Edm.register(target);
                }
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
                if (type){
                    Reflect.defineMetadata(EdmComplexType, type, target, targetKey);
                }else{
                    type = Reflect.getMetadata(EdmEntityType, element, EdmType);
                    Reflect.defineMetadata(EdmEntityType, type, target, targetKey);
                }
            }
        };
    }
    export function getTypeName(target:Function, propertyKey:string):string{
        let type = Reflect.getMetadata(EdmType, target.prototype, propertyKey) || Reflect.getMetadata(EdmType, target.prototype);
        let elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey) || Reflect.getMetadata(EdmElementType, target.prototype);
        if (typeof type == "string" && type != "Collection" && type.indexOf(".") < 0){
            for (let i = 0; i < EdmContainer.length; i++){
                let containerType = EdmContainer[i];
                let namespace = (<any>containerType).namespace || (<any>target).namespace || "Default";
                let containerTypeName = (<any>containerType).name;
                if (containerTypeName == type){
                    type = namespace + "." + type;
                    break;
                }
            }
        }else if (typeof type == "function"){
            type = ((<any>type).namespace || (<any>target).namespace || "Default") + "." + (<any>type).name;
        }
        if (typeof elementType == "string" && elementType != "Collection" && elementType.indexOf(".") < 0){
            for (let i = 0; i < EdmContainer.length; i++){
                let containerType = EdmContainer[i];
                let namespace = (<any>containerType).namespace || (<any>target).namespace || "Default";
                let containerTypeName = (<any>containerType).name;
                if (containerTypeName == elementType){
                    elementType = namespace + "." + elementType;
                    break;
                }
            }
        }else if (typeof elementType == "function"){
            elementType = ((<any>elementType).namespace || (<any>target).namespace || "Default") + "." + (<any>elementType).name;
        }
        return elementType ? type + "(" + elementType + ")" : type;
    }
    export function getType(target:Function, propertyKey:string):Function | string{
        let type = Reflect.getMetadata(EdmType, target.prototype, propertyKey);
        let elementType = Reflect.getMetadata(EdmElementType, target.prototype, propertyKey);
        let isEntityType = Edm.isEntityType(target, propertyKey);
        if (!elementType) elementType = type;
        if (isEntityType){
            if (typeof elementType == "string" && elementType.indexOf(".") < 0) elementType = ((<any>target).namespace || "Default") + "." + elementType;
            if (typeof type == "string" && type.indexOf(".") < 0) type = ((<any>target).namespace || "Default") + "." + type;
        }
        for (let i = 0; i < EdmContainer.length; i++){
            let containerType = EdmContainer[i];
            let namespace = (<any>containerType).namespace || (<any>target).namespace || "Default";
            let containerTypeName = (namespace ? namespace + "." : "") + (<any>containerType).name;
            if (containerTypeName == elementType){
                return containerType;
            }
        }
        return elementType;
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

    export const Key = (function Key(){
        return function(target, targetKey){
            if (typeof target == "function"){
                Edm.register(target);
            }
            let properties:string[] = Reflect.getMetadata(EdmKeyProperties, target) || [];
            if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
            Reflect.defineMetadata(EdmKeyProperties, properties, target);
            Reflect.defineMetadata(EdmKeyProperty, true, target, targetKey);
        };
    })();
    export function isKey(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmKeyProperty, target.prototype, propertyKey) || false;
    }
    export function getKeyProperties(target:Function):string[]{
        return Reflect.getMetadata(EdmKeyProperties, target) || Reflect.getMetadata(EdmKeyProperties, target.prototype) || [];
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

    export const Computed = (function Computed(){
        return function(target, targetKey){
            if (typeof target == "function"){
                Edm.register(target);
            }
            Reflect.defineMetadata(EdmComputedProperty, true, target, targetKey);
        };
    })();
    export function isComputed(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmComputedProperty, target.prototype, propertyKey) || false;
    }

    export const Nullable = (function Nullable(){
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
            }else{
                if (typeof target == "function"){
                    Edm.register(target);
                }
                Reflect.defineMetadata(EdmNullableProperty, true, target, targetKey);
            }
        }
    })();
    export function isNullable(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey);
    }

    export const Required = (function Required(){
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
            }else{
                if (typeof target == "function"){
                    Edm.register(target);
                }
                Reflect.defineMetadata(EdmNullableProperty, false, target, targetKey);
            }
        }
    })();
    export function isRequired(target:Function, propertyKey:string):boolean{
        return Reflect.getMetadata(EdmNullableProperty, target.prototype, propertyKey) == false ? true : false;
    }

    function operationDecoratorFactory(type, returnType?){
        return function(target, targetKey){
            let element = function(){};
            (<any>element).target = target;
            (<any>element).targetKey = targetKey;
            if (typeof returnType != "undefined") {
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
    export const ActionImport = operationDecoratorFactory(EdmAction);
    export const Action = operationDecoratorFactory(EdmAction);
    export function FunctionImport(returnType:any){
        return operationDecoratorFactory(EdmFunction, returnType);
    }
    export function Function(returnType:any){
        return operationDecoratorFactory(EdmFunction, returnType);
    }
    export function getOperations(target:Function):string[]{
        return Reflect.getOwnMetadata(EdmOperations, target.prototype) || [];
    }

    export function getReturnTypeName(target:Function, propertyKey:string):string{
        let returnType = Reflect.getMetadata(EdmReturnType, target.prototype, propertyKey);
        return Edm.getTypeName(returnType, EdmReturnType);
    }
    export function getReturnType(target:Function, propertyKey:string):Function | string{
        let returnType = Reflect.getMetadata(EdmReturnType, target.prototype, propertyKey);
        return Edm.getType(returnType, EdmReturnType);
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
            if (typeof target == "function"){
                Edm.register(target);
            }
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

    export function MediaEntity(contentType:string){
        return Reflect.metadata(EdmMediaEntity, contentType);
    }
    export function isMediaEntity(target:Function){
        return Reflect.hasMetadata(EdmMediaEntity, target);
    }
    export function getContentType(target:Function){
        return Reflect.getMetadata(EdmMediaEntity, target);
    }

    export const OpenType = (function OpenType(){
        return Reflect.metadata(EdmOpenType, true);
    })();
    export function isOpenType(target:Function){
        return Reflect.hasMetadata(EdmOpenType, target) || false;
    }

    export function EntityType(type?:Function | string){
        return function(target:any, targetKey?:string){
            if (typeof target == "function"){
                Edm.register(target);
            }
            if (targetKey != EdmType){
                let properties:string[] = Reflect.getMetadata(EdmProperties, target) || [];
                if (properties.indexOf(targetKey) < 0) properties.push(targetKey);
                Reflect.defineMetadata(EdmProperties, properties, target);
            }
            Reflect.defineMetadata(EdmEntityType, type, target, targetKey);
            Reflect.defineMetadata(EdmType, type, target, targetKey);
        };
    }
    export function isEntityType(target:Function, propertyKey:string):boolean{
        return Reflect.hasMetadata(EdmEntityType, target.prototype, propertyKey);
    }
    export function register(type:Function){
        if (EdmContainer.indexOf(type) < 0) EdmContainer.push(type);
    }

    export function Convert(converter:Function){
        return function(target, targetKey){
            if (typeof target == "function"){
                Edm.register(target);
            }
            Reflect.defineMetadata(EdmConverter, converter, target, targetKey);
        };
    }
    export function getConverter(target:Function, propertyKey:string):Function{
        return Reflect.getMetadata(EdmConverter, target.prototype, propertyKey);
    }

    export function Annotate(...annotation:any[]){
        return function(target:any, targetKey?:string){
            if (typeof target == "function"){
                Edm.register(target);
            }
            let existingAnnotations:any[] = Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
            existingAnnotations = annotation.concat(existingAnnotations);
            Reflect.defineMetadata(EdmAnnotations, existingAnnotations, target, targetKey);
        };
    }
    export function getAnnotations(target:Function, targetKey?:string):any[]{
        return Reflect.getOwnMetadata(EdmAnnotations, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmAnnotations, target, targetKey) || [];
    }

    export function ForeignKey(...keys:string[]){
        return function(target:any, targetKey?:string){
            if (typeof target == "function"){
                Edm.register(target);
            }
            let existingForeignKeys:any[] = Reflect.getOwnMetadata(EdmForeignKeys, target, targetKey) || [];
            existingForeignKeys = keys.concat(existingForeignKeys);
            Reflect.defineMetadata(EdmForeignKeys, existingForeignKeys, target, targetKey);
        };
    }
    export function getForeignKeys(target:Function, targetKey?:string):string[]{
        return Reflect.getOwnMetadata(EdmForeignKeys, target.prototype, targetKey) || Reflect.getOwnMetadata(EdmForeignKeys, target, targetKey) || [];
    }

    export function Partner(property:string){
        return Reflect.metadata(EdmPartnerProperty, property);
    }
    export function getPartner(target:any, targetKey:string){
        return Reflect.getMetadata(EdmPartnerProperty, target, targetKey) || Reflect.getMetadata(EdmPartnerProperty, target.prototype, targetKey);
    }

    export function EntitySet(name:string){
        return function(controller:typeof ODataController){
            controller.prototype.entitySetName = name;
        };
    }
}