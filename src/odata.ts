import { ODataServer } from "./server";
import { ODataController } from "./controller";

export namespace odata{
    export function type(elementType:Function){
        return function(constructor:Function){
            constructor.prototype.elementType = elementType;
        };
    }

    export function context(collectionName:string){
        return function(constructor:Function){
            constructor.prototype.collectionName = collectionName;
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

    export function controller(controller:typeof ODataController){
        return function(server:typeof ODataServer){
            server.prototype[controller.prototype.collectionName] = controller;
        };
    }

    export function config(configuration:any){
        return function(server:typeof ODataServer){
            server.prototype.configuration = configuration;
        };
    }

    export function cors(){
        return function(server:typeof ODataServer){
            (<any>server).cors = true;
        };
    }
}