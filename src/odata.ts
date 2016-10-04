import "reflect-metadata";
import { ODataServer } from "./server";
import { ODataController } from "./controller";
import { getFunctionParameters, getAllPropertyNames } from "./utils";

export class ODataMethodType{
    static GET:string = "GET";
    static POST:string = "POST";
    static PUT:string = "PUT";
    static PATCH:string = "PATCH";
    static DELETE:string = "DELETE";
}

export namespace odata{
    const ODataEntitySets:string = "odata:entitysets";
    const ODataMethod:string = "odata:method";
    const ODataKeyParameters:string = "odata:keyparameters";
    const ODataQueryParameter:string = "odata:queryparameter";
    const ODataFilterParameter:string = "odata:filterparameter";
    const ODataBodyParameter:string = "odata:bodyparameter";
    const ODataContextParameter:string = "odata:contextparameter";

    export function type(elementType:Function){
        return function(constructor:Function){
            constructor.prototype.elementType = elementType;
        };
    }

    export function namespace(namespace:string){
        return function(target:any, targetKey?:string){
            if (targetKey) target[targetKey].namespace = namespace;
            else target.namespace = namespace;
        };
    }

    export function container(name:string){
        return function(server:typeof ODataServer){
            server.containerName = name;
        };
    }

    export function controller(controller:typeof ODataController, isPublic?:boolean);
    export function controller(controller:typeof ODataController, isPublic?:boolean, elementType?:Function);
    export function controller(controller:typeof ODataController, entitySetName?:string, elementType?:Function);
    export function controller(controller:typeof ODataController, entitySetName?:string | boolean, elementType?:Function){
        return function(server:typeof ODataServer){
            server.prototype[(<any>controller).name] = controller;
            entitySetName = (typeof entitySetName == "string" ? entitySetName : "") || controller.prototype.entitySetName || (entitySetName === true ? controller.name.replace("Controller", "") : false);
            if (entitySetName){
                let entitySets:any[] = Reflect.getOwnMetadata(ODataEntitySets, server) || {};
                entitySets[<string>entitySetName] = controller;
                Reflect.defineMetadata(ODataEntitySets, entitySets, server);
            }
            if (elementType){
                controller.prototype.elementType = elementType;
            }
            if (!controller.prototype.elementType){
                controller.prototype.elementType = Object;
            }
        };
    }
    export function getPublicControllers(server:typeof ODataServer){
        return Reflect.getOwnMetadata(ODataEntitySets, server) || {};
    }

    export function cors(){
        return function(server:typeof ODataServer){
            (<any>server).cors = true;
        };
    }

    function odataMethodFactory(type:string){
        return function(target, targetKey){
            Reflect.defineMetadata(ODataMethod, type, target, targetKey);
        }
    }

    export function GET(){
        return odataMethodFactory("GET");
    }

    export function POST(){
        return odataMethodFactory("POST");
    }

    export function PUT(){
        return odataMethodFactory("PUT");
    }

    export function PATCH(){
        return odataMethodFactory("PATCH");
    }

    export function DELETE(){
        return odataMethodFactory("DELETE");
    }

    export function method(method:string){
        return odataMethodFactory(method.toUpperCase());
    }
    export function getMethod(target, targetKey){
        return Reflect.getMetadata(ODataMethod, target.prototype, targetKey);
    }

    export function key(name?:string){
        return function(target, targetKey, parameterIndex:number){
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(ODataKeyParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            existingParameters.push({
                from: name || paramName,
                to: paramName
            });
            Reflect.defineMetadata(ODataKeyParameters, existingParameters, target, targetKey);
        }
    }

    export function getKeys(target, targetKey){
        return Reflect.getMetadata(ODataKeyParameters, target.prototype, targetKey) || [];
    }

    export function findODataMethod(target, method, keys){
        keys = keys || [];
        let propNames = getAllPropertyNames(target.prototype);
        for (let prop of propNames){
            if (odata.getMethod(target, prop) == method.toUpperCase()){
                let fnKeys = odata.getKeys(target, prop);
                if (keys.length == fnKeys.length){
                    return {
                        call: prop,
                        key: fnKeys
                    };
                }
            }
        }

        for (let prop of propNames){
            if (prop == method.toLowerCase()){
                let fnKeys = odata.getKeys(target, prop);
                if (keys.length == fnKeys.length){
                    return {
                        call: prop,
                        key: fnKeys
                    };
                }
            }
        }

        for (let prop of propNames){
            if (prop == method.toLowerCase()){
                return {
                    call: prop,
                    key: []
                };
            }
        }
    }

    export function query(){
        return function(target, targetKey, parameterIndex:number){
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataQueryParameter, paramName, target, targetKey);
        }
    }
    export function getQueryParameter(target, targetKey){
        return Reflect.getMetadata(ODataQueryParameter, target.prototype, targetKey);
    }

    export function filter(){
        return function(target, targetKey, parameterIndex:number){
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataFilterParameter, paramName, target, targetKey);
        }
    }
    export function getFilterParameter(target, targetKey){
        return Reflect.getMetadata(ODataFilterParameter, target.prototype, targetKey);
    }

    export function body(){
        return function(target, targetKey, parameterIndex:number){
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataBodyParameter, paramName, target, targetKey);
        }
    }
    export function getBodyParameter(target, targetKey){
        return Reflect.getMetadata(ODataBodyParameter, target.prototype, targetKey);
    }

    export function context(){
        return function(target, targetKey, parameterIndex:number){
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataContextParameter, paramName, target, targetKey);
        }
    }
    export function getContextParameter(target, targetKey){
        return Reflect.getMetadata(ODataContextParameter, target.prototype, targetKey);
    }
}