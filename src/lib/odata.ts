import "reflect-metadata";
import { ODataServer } from "./server";
import { ODataController } from "./controller";
import { getFunctionParameters, getAllPropertyNames } from "./utils";

export class ODataMethodType {
    static GET: string = "GET";
    static POST: string = "POST";
    static PUT: string = "PUT";
    static PATCH: string = "PATCH";
    static DELETE: string = "DELETE";
}

export namespace odata {
    const ODataEntitySets: string = "odata:entitysets";
    const ODataMethod: string = "odata:method";
    const ODataKeyParameters: string = "odata:keyparameters";
    const ODataLinkParameters: string = "odata:linkparameters";
    const ODataQueryParameter: string = "odata:queryparameter";
    const ODataFilterParameter: string = "odata:filterparameter";
    const ODataBodyParameter: string = "odata:bodyparameter";
    const ODataContextParameter: string = "odata:contextparameter";
    const ODataStreamParameter: string = "odata:streamparameter";
    const ODataResultParameter: string = "odata:resultparameter";
    const ODataIdParameter: string = "odata:idparameter";

    export function type(elementType: Function) {
        return function (constructor: Function) {
            constructor.prototype.elementType = elementType;
        };
    }

    export function namespace(namespace: string) {
        return function (target: any, targetKey?: string) {
            if (targetKey) target[targetKey].namespace = namespace;
            else target.namespace = namespace;
        };
    }

    export function container(name: string) {
        return function (server: typeof ODataServer) {
            server.containerName = name;
        };
    }

    /** Class decorator for ODataServer. 
     * @param controller
     * @param isPublic
     */
    export function controller(controller: typeof ODataController, isPublic?: boolean);
    /** Class decorator for ODataServer
     * @param controller instance of ODataController
     * @param isPublic 
     * @param elementType type of element
     */
    export function controller(controller: typeof ODataController, isPublic?: boolean, elementType?: Function);
    /** Class decorator for ODataServer
     * @param controller instance of ODataController
     * @param entitySetName
     * @param elementType type of element
     */
    export function controller(controller: typeof ODataController, entitySetName?: string, elementType?: Function);
    /** Class decorator for ODataServer
     * @param controller instance of ODataController
     * @param entitySetName
     * @param elementType type of element
     */
    export function controller(controller: typeof ODataController, entitySetName?: string | boolean, elementType?: Function) {
        return function (server: typeof ODataServer) {
            server.prototype[(<any>controller).name] = controller;
            entitySetName = (typeof entitySetName == "string" ? entitySetName : "") || controller.prototype.entitySetName || (entitySetName === true ? (<any>controller).name.replace("Controller", "") : false);
            if (entitySetName) {
                let entitySets: any[] = Reflect.getOwnMetadata(ODataEntitySets, server) || {};
                entitySets[<string>entitySetName] = controller;
                Reflect.defineMetadata(ODataEntitySets, entitySets, server);
            }
            if (elementType) {
                controller.prototype.elementType = elementType;
            }
            if (!controller.prototype.elementType) {
                controller.prototype.elementType = Object;
            }
        };
    }
    /** Get metadata value of ODataEntitySets of the given ODataServer
     * @param server
     */
    export function getPublicControllers(server: typeof ODataServer) {
        return Reflect.getOwnMetadata(ODataEntitySets, server) || {};
    }

    /** Turns on the CORS on ODataServer
     * @param server ODataServer where we turn the CORS on
     * */
    export const cors = (function cors() {
        return function (server: typeof ODataServer) {
            (<any>server).cors = true;
        };
    })();

    function odataMethodFactory(type: string, navigationProperty?: string) {
        type = type.toLowerCase();
        let decorator: any = function (target, targetKey) {
            let existingMethods: any[] = Reflect.getMetadata(ODataMethod, target, targetKey) || [];
            existingMethods.push(type);
            Reflect.defineMetadata(ODataMethod, existingMethods, target, targetKey);
            return decorator;
        }
        let fn: any = function (target: any, targetKey?: string): any {
            if (arguments.length == 0) return decorator;
            else return decorator(target, targetKey);
        };
        if (typeof navigationProperty == "string") {
            type += "/" + navigationProperty;
            fn.$ref = decorator.$ref = function (target, targetKey) {
                type += "/$ref";
                let existingMethods: any[] = Reflect.getMetadata(ODataMethod, target, targetKey) || [];
                existingMethods.push(type);
                Reflect.defineMetadata(ODataMethod, existingMethods, target, targetKey);
            };
        }

        return fn;
    }

    /** Annotate function for OData GET operation
     * @param navigationProperty Navigation property name to handle
     */
    export function GET(navigationProperty: string);
    /** Annotate function for OData GET operation
     */
    export function GET();
    /** Annotate function for OData GET operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function GET(target?: any, targetKey?: string);
    /** Annotate function for OData GET operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function GET(target?: any, targetKey?: string) {
        if (typeof target == "string" || typeof target == "undefined") return odataMethodFactory("GET", target);
        odataMethodFactory("GET", target)(target, targetKey);
    }
    /** Annotate function for OData POST operation
     * @param navigationProperty Navigation property name to handle
     */
    export function POST(navigationProperty: string);
    /** Annotate function for OData POST operation */
    export function POST();
    /** Annotate function for OData POST operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function POST(target?: any, targetKey?: string);
    /** Annotate function for OData POST operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function POST(target?: any, targetKey?: string) {
        if (typeof target == "string" || typeof target == "undefined") return odataMethodFactory("POST", target);
        odataMethodFactory("POST", target)(target, targetKey);
    }
    /** Annotate function for OData PUT operation
     * @param navigationProperty Navigation property name to handle
     */
    export function PUT(navigationProperty: string);
    /** Annotate function for OData PUT operation */
    export function PUT();
    /** Annotate function for OData PUT operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function PUT(target?: any, targetKey?: string);
    /** Annotate function for OData PUT operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function PUT(target?: any, targetKey?: string) {
        if (typeof target == "string" || typeof target == "undefined") return odataMethodFactory("PUT", target);
        odataMethodFactory("PUT", target)(target, targetKey);
    }
    /** Annotate function for OData PATCH operation
     * @param navigationProperty Navigation property name to handle
     */
    export function PATCH(navigationProperty: string);
    /** Annotate function for OData PATCH operation */
    export function PATCH();
    /** Annotate function for OData PATCH operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function PATCH(target?: any, targetKey?: string);
    /** Annotate function for OData PATCH operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function PATCH(target?: any, targetKey?: string) {
        if (typeof target == "string" || typeof target == "undefined") return odataMethodFactory("PATCH", target);
        odataMethodFactory("PATCH", target)(target, targetKey);
    }
    /** Annotate function for OData DELETE operation
     * @param navigationProperty Navigation property name to handle
     */
    export function DELETE(navigationProperty: string);
    /** Annotate function for OData DELETE operation */
    export function DELETE();
    /** Annotate function for OData DELETE operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function DELETE(target?: any, targetKey?: string);
    /** Annotate function for OData DELETE operation
     * @param target    Target object
     * @param targetKey Target property
     */
    export function DELETE(target?: any, targetKey?: string) {
        if (typeof target == "string" || typeof target == "undefined") return odataMethodFactory("DELETE", target);
        odataMethodFactory("DELETE", target)(target, targetKey);
    }

    /** Create reference for OData POST operation
     * @param navigationProperty Navigation property name to handle
     */
    export function createRef(navigationProperty: string) {
        return POST(navigationProperty).$ref;
    }
    /** Create reference for OData PUT operation
     * @param navigationProperty Navigation property name to handle
     */
    export function updateRef(navigationProperty: string) {
        return PUT(navigationProperty).$ref;
    }
    /** Create reference for OData DELETE operation
     * @param navigationProperty Navigation property name to handle
     */
    export function deleteRef(navigationProperty: string) {
        return DELETE(navigationProperty).$ref;
    }

    /** Annotate function for a specified OData method operation */
    export function method(method: string, navigationProperty?: string) {
        return odataMethodFactory(method.toUpperCase(), navigationProperty);
    }
    /** get metadata value of ODataMethod on the prototype chain of target or targetKey
     * @param target    target object
     * @param targetKey target property
     */
    export function getMethod(target, targetKey) {
        return Reflect.getMetadata(ODataMethod, target.prototype, targetKey);
    }

    export function key(name?: string);
    export function key(target: any, targetKey: string, parameterIndex: number);
    export function key(target: any, targetKey?: string, parameterIndex?: number): any {
        let name;
        let decorator = function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(ODataKeyParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            existingParameters.push({
                from: name || paramName,
                to: paramName
            });
            Reflect.defineMetadata(ODataKeyParameters, existingParameters, target, targetKey);
        }

        if (typeof target == "string" || typeof target == "undefined" || !target) {
            name = target;
            return decorator;
        } else return decorator(target, targetKey, parameterIndex);
    }
    /** get metadata value of ODataKeyParameters on the prototype chain of target or targetKey
     * @param target    target object
     * @param targetKey target property
     */
    export function getKeys(target, targetKey) {
        return Reflect.getMetadata(ODataKeyParameters, target.prototype, targetKey) || [];
    }

    export function link(name?: string);
    export function link(target: any, targetKey: string, parameterIndex: number);
    export function link(target: any, targetKey?: string, parameterIndex?: number): any {
        let name;
        let decorator = function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let existingParameters: any[] = Reflect.getOwnMetadata(ODataLinkParameters, target, targetKey) || [];
            let paramName = parameterNames[parameterIndex];
            existingParameters.push({
                from: name || paramName,
                to: paramName
            });
            Reflect.defineMetadata(ODataLinkParameters, existingParameters, target, targetKey);
        }

        if (typeof target == "string" || typeof target == "undefined" || !target) {
            name = target;
            return decorator;
        } else return decorator(target, targetKey, parameterIndex);
    }
    /** get metadata value of ODataLinkParameters on the prototype chain of target or targetKey
     * @param target    target object
     * @param targetKey target property
     */
    export function getLinks(target, targetKey) {
        return Reflect.getMetadata(ODataLinkParameters, target.prototype, targetKey) || [];
    }

    /** Finds the given OData method 
     * @param {any} target
     * @param {any} method
     * @param {any} keys
     */
    export function findODataMethod(target, method, keys) {
        keys = keys || [];
        let propNames = getAllPropertyNames(target.prototype);
        for (let prop of propNames) {
            if (odata.getMethod(target, prop) && odata.getMethod(target, prop).indexOf(method) >= 0) {
                let fnKeys = odata.getKeys(target, prop);
                if (keys.length == fnKeys.length) {
                    return {
                        call: prop,
                        key: fnKeys,
                        link: odata.getLinks(target, prop)
                    };
                }
            }
        }

        for (let prop of propNames) {
            if (prop == method.toLowerCase()) {
                let fnKeys = odata.getKeys(target, prop);
                if (keys.length == fnKeys.length) {
                    return {
                        call: prop,
                        key: fnKeys,
                        link: odata.getLinks(target, prop)
                    };
                }
            }
        }

        for (let prop of propNames) {
            if (odata.getMethod(target, prop) && odata.getMethod(target, prop).indexOf(method) >= 0) {
                return {
                    call: prop,
                    key: [],
                    link: odata.getLinks(target, prop)
                };
            }
        }

        for (let prop of propNames) {
            if (prop == method.toLowerCase()) {
                return {
                    call: prop,
                    key: [],
                    link: odata.getLinks(target, prop)
                };
            }
        }
    }

    /** Query parameter injection decorator. Defines query parameter metadata on target or targetKey.
     * @param target            target object
     * @param targetKey         target property
     * @param parameterIndex    index of query parameter
     */
    export const query = (function query() {
        return function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataQueryParameter, paramName, target, targetKey);
        };
    })();

    /** Get metadata value of query parameter on the prototype chain of target or targetKey.
     * @param target    target object
     * @param targetKey target property
     */
    export function getQueryParameter(target, targetKey) {
        return Reflect.getMetadata(ODataQueryParameter, target.prototype, targetKey);
    }

    /** Filter parameter injection decorator. Defines filter parameter metadata on target or targetKey.
     * @param target            target object
     * @param targetKey         target property
     * @param parameterIndex    index of filter parameter
     */
    export const filter = (function filter() {
        return function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataFilterParameter, paramName, target, targetKey);
        };
    })();

    /** Get metadata value of filter parameter on the prototype chain of target or targetKey.
     * @param target    target object
     * @param targetKey target property
     */
    export function getFilterParameter(target, targetKey) {
        return Reflect.getMetadata(ODataFilterParameter, target.prototype, targetKey);
    }

    /** Body parameter injection decorator. Defines body parameter metadata on target or targetKey.
     * @param target            target object
     * @param targetKey         target property
     * @param parameterIndex    index of body parameter
     */
    export const body = (function body() {
        return function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataBodyParameter, paramName, target, targetKey);
        };
    })();

    /** Get metadata value of body parameter on the prototype chain of target or targetKey.
     * @param target    target object
     * @param targetKey target property
     */
    export function getBodyParameter(target, targetKey) {
        return Reflect.getMetadata(ODataBodyParameter, target.prototype, targetKey);
    }

    /** Context parameter injection decorator. Defines context parameter metadata on target or targetKey.
     * @param target            target object
     * @param targetKey         target property
     * @param parameterIndex    index of context parameter
     */
    export const context = (function context() {
        return function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataContextParameter, paramName, target, targetKey);
        };
    })();

    /** Get metadata value of context parameter on the prototype chain of target or targetKey.
     * @param target    target object
     * @param targetKey target property
     */
    export function getContextParameter(target, targetKey) {
        return Reflect.getMetadata(ODataContextParameter, target.prototype, targetKey);
    }

    /** Stream parameter injection decorator. Defines stream parameter metadata on target or targetKey.
     * @param target            target object
     * @param targetKey         target property
     * @param parameterIndex    index of stream parameter
     */
    export const stream = (function stream() {
        return function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataStreamParameter, paramName, target, targetKey);
        };
    })();

    /** Get metadata value of stream parameter on the prototype chain of target or targetKey.
     * @param target    target object
     * @param targetKey target property
     */
    export function getStreamParameter(target, targetKey) {
        return Reflect.getMetadata(ODataStreamParameter, target.prototype, targetKey);
    }

    /** Result parameter injection decorator. Defines result parameter metadata on target or targetKey.
     * @param target            target object
     * @param targetKey         target property
     * @param parameterIndex    index of result parameter
     */
    export const result = (function result() {
        return function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataResultParameter, paramName, target, targetKey);
        };
    })();

    /** Get metadata value of result parameter on the prototype chain of the given target or targetKey.
     * @param target    target object
     * @param targetKey target property
     */
    export function getResultParameter(target, targetKey) {
        return Reflect.getMetadata(ODataResultParameter, target.prototype, targetKey);
    }

    /** Id parameter injection decorator. Defines id parameter metadata on target or targetKey.
     * @param target            target object
     * @param targetKey         target property
     * @param parameterIndex    index of id parameter
     */
    export const id = (function id() {
        return function (target, targetKey, parameterIndex: number) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let paramName = parameterNames[parameterIndex];
            Reflect.defineMetadata(ODataIdParameter, paramName, target, targetKey);
        };
    })();

    /** Get metadata value of id parameter on the prototype chain of target or targetKey.
     * @param target    target object
     * @param targetKey target property
     */
    export function getIdParameter(target, targetKey) {
        return Reflect.getMetadata(ODataIdParameter, target.prototype, targetKey);
    }

    export function parameter(name: string, type: Function) {
        return function (target?: any, targetKey?: string) {
            let parameterNames = getFunctionParameters(target, targetKey);
            let parameterIndex = parameterNames.indexOf(name);
            if (parameterIndex >= 0) {
                type(target, targetKey, parameterIndex);
            }
        };
    }

    export function parameters(parameters: any) {
        return function (target?: any, targetKey?: string) {
            for (let prop in parameters) {
                parameter(prop, parameters[prop])(target, targetKey);
            }
        }
    }
}