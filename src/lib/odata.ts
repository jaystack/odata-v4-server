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

/** Set element type
 * @param elementType The type of element
 */
export function type(elementType: Function) {
    return function (constructor: Function) {
        constructor.prototype.elementType = elementType;
    };
}

/** Set namespace
 * @param namespace Namespace to be set
 */
export function namespace(namespace: string) {
    return function (target: any, targetKey?: string) {
        if (targetKey) target[targetKey].namespace = namespace;
        else target.namespace = namespace;
    };
}

/** Set container
 * @param name  Name of the container
 */
export function container(name: string) {
    return function (server: typeof ODataServer) {
        server.containerName = name;
    };
}

/** Class decorator for server that binds the given controller to the server. 
 * @param controller    Controller to be bind to the server.
 * @param isPublic      Is the binding public or not.
 */
export function controller(controller: typeof ODataController, isPublic?: boolean);
/** Class decorator for server that binds the given controller to the server.
 * @param controller    Controller to be bind to the server.
 * @param isPublic      Is the binding public or not.
 * @param elementType   Type of the element.
 */
export function controller(controller: typeof ODataController, isPublic?: boolean, elementType?: Function);
/** Class decorator for server that binds the given controller to the server.
 * @param controller    Controller to be bind to the server.
 * @param entitySetName The name of the entity set.
 * @param elementType   Type of the element.
 */
export function controller(controller: typeof ODataController, entitySetName?: string, elementType?: Function);
/** Class decorator for server that binds the given controller to the server.
 * @param controller    Controller to be bind to the server.
 * @param entitySetName The name of the entity set.
 * @param elementType   Type of the element.
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
/** Gives the public controllers of the given server
 * @param server
 */
export function getPublicControllers(server: typeof ODataServer) {
    return Reflect.getOwnMetadata(ODataEntitySets, server) || {};
}

/** Enables CORS on your server
 * @param server The server where you turn the CORS on
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
/** Annotate function for OData GET operation */
export function GET();
/** Annotate function for OData GET operation
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function GET(target?: any, targetKey?: string);
/** Annotate function for OData GET operation
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
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
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function POST(target?: any, targetKey?: string);
/** Annotate function for OData POST operation
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
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
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function PUT(target?: any, targetKey?: string);
/** Annotate function for OData PUT operation
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
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
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function PATCH(target?: any, targetKey?: string);
/** Annotate function for OData PATCH operation
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
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
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function DELETE(target?: any, targetKey?: string);
/** Annotate function for OData DELETE operation
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
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
/** Update reference for OData PUT operation
 * @param navigationProperty Navigation property name to handle
 */
export function updateRef(navigationProperty: string) {
    return PUT(navigationProperty).$ref;
}
/** Delete reference for OData DELETE operation
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
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getMethod(target, targetKey) {
    return Reflect.getMetadata(ODataMethod, target.prototype, targetKey);
}

/** Gives the entity key
 * @param name
 */
export function key(name?: string);
/** Gives the entity key
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export function key(target: any, targetKey: string, parameterIndex: number);
/** Gives the entity key
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
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
/** Gives the decorated key parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getKeys(target, targetKey) {
    return Reflect.getMetadata(ODataKeyParameters, target.prototype, targetKey) || [];
}

/** Gives the identifier of the referenced entity.
 * @param name
 */
export function link(name?: string);
/** Gives the identifier of the referenced entity.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export function link(target: any, targetKey: string, parameterIndex: number);
/** Gives the identifier of the referenced entity.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
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
/** Gives the decorated link parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
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
        if (getMethod(target, prop) && getMethod(target, prop).indexOf(method) >= 0) {
            let fnKeys = getKeys(target, prop);
            if (keys.length == fnKeys.length) {
                return {
                    call: prop,
                    key: fnKeys,
                    link: getLinks(target, prop)
                };
            }
        }
    }

    for (let prop of propNames) {
        if (prop == method.toLowerCase()) {
            let fnKeys = getKeys(target, prop);
            if (keys.length == fnKeys.length) {
                return {
                    call: prop,
                    key: fnKeys,
                    link: getLinks(target, prop)
                };
            }
        }
    }

    for (let prop of propNames) {
        if (getMethod(target, prop) && getMethod(target, prop).indexOf(method) >= 0) {
            return {
                call: prop,
                key: [],
                link: getLinks(target, prop)
            };
        }
    }

    for (let prop of propNames) {
        if (prop == method.toLowerCase()) {
            return {
                call: prop,
                key: [],
                link: getLinks(target, prop)
            };
        }
    }
}

/** Provides access to all OData query options.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export const query = (function query() {
    return function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataQueryParameter, paramName, target, targetKey);
    };
})();

/** Gives the decorated query parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getQueryParameter(target, targetKey) {
    return Reflect.getMetadata(ODataQueryParameter, target.prototype, targetKey);
}

/** Gives filter information and provides the AST tree of the OData $filter.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export const filter = (function filter() {
    return function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataFilterParameter, paramName, target, targetKey);
    };
})();

/** Gives the decorated filter parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getFilterParameter(target, targetKey) {
    return Reflect.getMetadata(ODataFilterParameter, target.prototype, targetKey);
}

/** Gives the body of the OData request.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export const body = (function body() {
    return function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataBodyParameter, paramName, target, targetKey);
    };
})();

/** Gives the decorated body parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getBodyParameter(target, targetKey) {
    return Reflect.getMetadata(ODataBodyParameter, target.prototype, targetKey);
}

/** Gives the current execution context.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export const context = (function context() {
    return function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataContextParameter, paramName, target, targetKey);
    };
})();

/** Gives the decorated context parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getContextParameter(target, targetKey) {
    return Reflect.getMetadata(ODataContextParameter, target.prototype, targetKey);
}

/** Gives a writable stream that will perform OData result transformation on the result and then sends it forward to your response stream.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export const stream = (function stream() {
    return function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataStreamParameter, paramName, target, targetKey);
    };
})();

/** Gives the decorated stream parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getStreamParameter(target, targetKey) {
    return Reflect.getMetadata(ODataStreamParameter, target.prototype, targetKey);
}

/** Gives the result from the last part from the resource path of the OData URL. This ensures the access to an entity in context of your action or function.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export const result = (function result() {
    return function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataResultParameter, paramName, target, targetKey);
    };
})();

/** Gives the decorated result parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getResultParameter(target, targetKey) {
    return Reflect.getMetadata(ODataResultParameter, target.prototype, targetKey);
}

/** Gives the url that was provided either in request body as @odata.id or in query parameters as $id.
 * @param target            The prototype of the class for an instance member
 * @param targetKey         The name of the class method
 * @param parameterIndex    The ordinal index of the parameter in the function’s parameter list
 */
export const id = (function id() {
    return function (target, targetKey, parameterIndex: number) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataIdParameter, paramName, target, targetKey);
    };
})();

/** Gives the decorated id parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getIdParameter(target, targetKey) {
    return Reflect.getMetadata(ODataIdParameter, target.prototype, targetKey);
}

/** Sets a parameter decorator for the given parameter.
 * @param name The name of the parameter.
 * @param type OData decorator type.
 */
export function parameter(name: string, type: Function) {
    return function (target?: any, targetKey?: string) {
        let parameterNames = getFunctionParameters(target, targetKey);
        let parameterIndex = parameterNames.indexOf(name);
        if (parameterIndex >= 0) {
            type(target, targetKey, parameterIndex);
        }
    };
}

/** Sets parameter decorators for the given parameters.
 * @param parameters Object that contains the name of the parameter as key and the type of the parameter as value.
 */
export function parameters(parameters: any) {
    return function (target?: any, targetKey?: string) {
        for (let prop in parameters) {
            parameter(prop, parameters[prop])(target, targetKey);
        }
    }
}