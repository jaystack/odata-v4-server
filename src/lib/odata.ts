import "reflect-metadata";
import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import { ErrorRequestHandler } from "express";
import { ODataServer } from "./server";
import { ODataController } from "./controller";
import { EntityType } from "./edm";
import { getFunctionParameters, getAllPropertyNames, PropertyDecorator } from "./utils";

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
const ODataTypeParameter: string = "odata:typeparameter";
const ODataNamespace: string = "odata:namespace";

/** Set element type
 * @param elementType The type of element
 */
export function type(elementType: any);
export function type(target: any, targetKey: string, parameterIndex: number);
export function type(elementType: Function, targetKey?, parameterIndex?): Function | void {
    if (typeof parameterIndex == "number") {
        let target = elementType;
        let parameterNames = getFunctionParameters(target, targetKey);
        let paramName = parameterNames[parameterIndex];
        Reflect.defineMetadata(ODataTypeParameter, paramName, target, targetKey);
    } else {
        return function (constructor: Function) {
            constructor.prototype.elementType = elementType;
        };
    }
}

/** Set namespace
 * @param namespace Namespace to be set
 */
export function namespace(namespace: string) {
    return function (target: any, targetKey?: string) {
        if (targetKey){
            if (target[targetKey]){
                target[targetKey].namespace = namespace;
            }else{
                Reflect.defineMetadata(ODataNamespace, namespace, target, targetKey);
            }
        }else target.namespace = namespace;
    };
}
export function getNamespace(target: any, targetKey?: string) {
    return Reflect.getMetadata(ODataNamespace, target.prototype, targetKey) || (target[targetKey] || target).namespace;
}

/** Set container
 * @param name  Name of the container
 */
export function container(name: string) {
    return function (target: any, targetKey?: string) {
        if (targetKey) target[targetKey].containerName = name;
        else target.containerName = name;
    };
}

/** Set parser
 * @param parser Parser to use (odata-v4-parser compatible functional parser)
 */
export function parser(parser: any) {
    return function (target: typeof ODataServer) {
        target.parser = parser;
    };
}

/** OData v4 connector interface
 * odata-v4-server compatible connector
 */
export interface IODataConnector {
    /**
     * Creates compiled query object from an OData URI string
     * @param {string} queryString - An OData query string
     * @return {Visitor} Visitor instance
     */
    createQuery(odataQuery: string);
    createQuery(odataQuery: Token);
    createQuery(odataQuery: string | Token, entityType?: Function);

    /**
     * Creates a query object from an OData filter expression string
     * @param {string} odataFilter - A filter expression in OData $filter format
     * @return {Object}  query object
     */
    createFilter(odataFilter: string): Object;
    createFilter(odataFilter: Token): Object;
    createFilter(odataFilter: string | Token, entityType?: Function): Object;
}

/** Attach connector
 * @param connector Connector to use
 */
export function connector(connector: IODataConnector) {
    return function (target: typeof ODataServer) {
        target.connector = connector;
    };
}

export interface IODataValidatorOptions {
    [option: string]: any;
}

export interface IODataValidator {
    /**
     * Validates OData query AST using validator options parameter
     * @param {string} odataQuery - An OData query string
     * @return {null} If validation succeeds, returns null, otherwise throws a ValidationError
     */
    validate(odataQuery: string, options?: IODataValidatorOptions);
    validate(odataQuery: Token, options?: IODataValidatorOptions);
    validate(odataQuery: string | Token, options?: IODataValidatorOptions);
}

/** Attach validator
 * @param connector Connector to use
 */
export function validation(validator: IODataValidator, options: IODataValidatorOptions) {
    return function (target: typeof ODataServer | typeof ODataController) {
        target.validator = function (odataQuery: string | Token) {
            return validator.validate(odataQuery, options);
        };
    };
}

/** Set error handler
 * @param errorHandler Error request handler to use
 */
export function error(errorHandler: ErrorRequestHandler) {
  return function (target: typeof ODataServer) {
      target.errorHandler = errorHandler;
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
        EntityType(controller.prototype.elementType)(server.prototype, (<any>controller).name);
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

function odataMethodFactory(type: string, navigationProperty?: string): ODataMethodDecorator | RefExpressionDecorator {
    if (type.indexOf("/") < 0) type = type.toLowerCase();
    let decorator: any = function (target, targetKey) {
        let existingMethods: any[] = Reflect.getMetadata(ODataMethod, target, targetKey) || [];
        existingMethods.unshift(type);
        Reflect.defineMetadata(ODataMethod, existingMethods, target, targetKey);
    }
    let createRefFn = function (navigationProperty) {
        let fn = odataMethodFactory(`${type}/${navigationProperty}`);
        (<RefExpressionDecorator>fn).$ref = function (target, targetKey) {
            let existingMethods: any[] = Reflect.getMetadata(ODataMethod, target, targetKey) || [];
            existingMethods.unshift(`${type}/${navigationProperty}/$ref`);
            Reflect.defineMetadata(ODataMethod, existingMethods, target, targetKey);
        };
        return <RefExpressionDecorator>fn;
    };
    if (typeof navigationProperty == "string") return createRefFn(navigationProperty);
    let fn: any = <ExpressionDecorator>function (target: any, targetKey?: string): any {
        if (typeof target == "string") return createRefFn(target);
        if (arguments.length == 0) return fn;
        else decorator(target, targetKey);
    };
    (<ExpressionDecorator>fn).$value = function (target, targetKey) {
        let existingMethods: any[] = Reflect.getMetadata(ODataMethod, target, targetKey) || [];
        existingMethods.unshift(`${type}/$value`);
        Reflect.defineMetadata(ODataMethod, existingMethods, target, targetKey);
    };

    return <ODataMethodDecorator>fn;
}

export interface ExpressionDecorator extends PropertyDecorator<ExpressionDecorator>, TypedPropertyDescriptor<any> {
    /** Annotate function for $value handler */
    $value: PropertyDecorator<void>
    /** Annotate function for $count handler */
    $count: PropertyDecorator<void>
}
export interface RefExpressionDecorator extends ExpressionDecorator {
    $ref: PropertyDecorator<void>
}
export interface ODataMethodDecorator extends ExpressionDecorator {
    (): ExpressionDecorator
    (navigationProperty: string): RefExpressionDecorator
}

export interface RefExpressionGETDecorator extends ExpressionDecorator {
    /** Create reference for OData GET operation */
    $ref: PropertyDecorator<void>
}
export interface ODataGETMethodDecorator extends ExpressionDecorator {
    /** Annotate function for OData GET operation */
    (): ExpressionDecorator
    /** Annotate function for OData GET operation
     * @param navigationProperty Navigation property name to handle
     */
    (navigationProperty: string): RefExpressionGETDecorator
    /** Annotate function for OData GET operation
     * @param target    The prototype of the class for an instance member
     * @param targetKey The name of the class method
     */
    (target?: any, targetKey?: string): ExpressionDecorator;
}
/** Annotate function for OData GET operation */
export const GET = <ODataGETMethodDecorator>odataMethodFactory("GET");

export interface RefExpressionPOSTDecorator extends ExpressionDecorator {
    /** Create reference for OData POST operation */
    $ref: PropertyDecorator<void>
}
export interface ODataPOSTMethodDecorator extends ExpressionDecorator {
    /** Annotate function for OData POST operation */
    (): ExpressionDecorator
    /** Annotate function for OData POST operation
     * @param navigationProperty Navigation property name to handle
     */
    (navigationProperty: string): RefExpressionPOSTDecorator
    /** Annotate function for OData POST operation
     * @param target    The prototype of the class for an instance member
     * @param targetKey The name of the class method
     */
    (target?: any, targetKey?: string): ExpressionDecorator;
}
/** Annotate function for OData POST operation */
export const POST = <ODataPOSTMethodDecorator>odataMethodFactory("POST");

export interface RefExpressionPUTDecorator extends ExpressionDecorator {
    /** Create reference for OData PUT operation */
    $ref: PropertyDecorator<void>
}
export interface ODataPUTMethodDecorator extends ExpressionDecorator {
    /** Annotate function for OData PUT operation */
    (): ExpressionDecorator
    /** Annotate function for OData PUT operation
     * @param navigationProperty Navigation property name to handle
     */
    (navigationProperty: string): RefExpressionPUTDecorator
    /** Annotate function for OData PUT operation
     * @param target    The prototype of the class for an instance member
     * @param targetKey The name of the class method
     */
    (target?: any, targetKey?: string): ExpressionDecorator;
}
/** Annotate function for OData PUT operation */
export const PUT = <ODataPUTMethodDecorator>odataMethodFactory("PUT");

export interface RefExpressionPATCHDecorator extends ExpressionDecorator {
    /** Create reference for OData PATCH operation */
    $ref: PropertyDecorator<void>
}
export interface ODataPATCHMethodDecorator extends ExpressionDecorator {
    /** Annotate function for OData PATCH operation */
    (): ExpressionDecorator
    /** Annotate function for OData PATCH operation
     * @param navigationProperty Navigation property name to handle
     */
    (navigationProperty: string): RefExpressionPATCHDecorator
    /** Annotate function for OData PATCH operation
     * @param target    The prototype of the class for an instance member
     * @param targetKey The name of the class method
     */
    (target?: any, targetKey?: string): ExpressionDecorator;
}
/** Annotate function for OData PATCH operation */
export const PATCH = <ODataPATCHMethodDecorator>odataMethodFactory("PATCH");

export interface RefExpressionDELETEDecorator extends ExpressionDecorator {
    /** Create reference for OData DELETE operation */
    $ref: PropertyDecorator<void>
}
export interface ODataDELETEMethodDecorator extends ExpressionDecorator {
    /** Annotate function for OData DELETE operation */
    (): ExpressionDecorator
    /** Annotate function for OData DELETE operation
     * @param navigationProperty Navigation property name to handle
     */
    (navigationProperty: string): RefExpressionDELETEDecorator
    /** Annotate function for OData DELETE operation
     * @param target    The prototype of the class for an instance member
     * @param targetKey The name of the class method
     */
    (target?: any, targetKey?: string): ExpressionDecorator;
}
/** Annotate function for OData DELETE operation */
export const DELETE = <ODataDELETEMethodDecorator>odataMethodFactory("DELETE");

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
export function method(method: string): ODataMethodDecorator;
/** Annotate function for a specified OData method operation */
export function method(method: string, navigationProperty: string): RefExpressionDecorator;
/** Annotate function for a specified OData method operation */
export function method(method: string, navigationProperty?: string): ODataMethodDecorator | RefExpressionDecorator {
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

    return null;
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

/** Gives the decorated type parameter.
 * @param target    The prototype of the class for an instance member
 * @param targetKey The name of the class method
 */
export function getTypeParameter(target, targetKey) {
    return Reflect.getMetadata(ODataTypeParameter, target.prototype, targetKey);
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

export interface IODataBase<T, C> {
    new(...args: any[]): T;
    define?(...decorators: Array<Function | Object>): IODataBase<T, C> & C;
}
export function ODataBase<T, C>(Base: C): IODataBase<T, C> & C {
    class ODataBaseClass extends (<any>Base) {
        /** Define class, properties and parameters with decorators */
        static define(...decorators: Array<Function | Object>): IODataBase<T, C> & C {
            decorators.forEach(decorator => {
                if (typeof decorator == 'function') {
                    decorator(this);
                } else if (typeof decorator == 'object') {
                    let props = Object.keys(decorator);
                    props.forEach(prop => {
                        let propDecorators = decorator[prop];
                        if (!Array.isArray(propDecorators)) propDecorators = [propDecorators];
                        propDecorators.forEach(propDecorator => {
                            if (typeof propDecorator == 'function') {
                                propDecorator(this.prototype, prop);
                            } else if (typeof propDecorator == 'object') {
                                let params = Object.keys(propDecorator);
                                let parameterNames = getFunctionParameters(this.prototype[prop]);
                                params.forEach(param => {
                                    let paramDecorators = propDecorator[param];
                                    if (!Array.isArray(paramDecorators)) paramDecorators = [paramDecorators];
                                    paramDecorators.forEach(paramDecorator => {
                                        if (typeof paramDecorator == 'function') {
                                            paramDecorator(this.prototype, prop, parameterNames.indexOf(param));
                                        } else {
                                            throw new Error(`Unsupported parameter decorator on ${this.name || this} at ${prop}.${param} using ${paramDecorator}`);
                                        }
                                    });
                                });
                            } else {
                                throw new Error(`Unsupported member decorator on ${this.name || this} at ${prop} using ${propDecorator}`);
                            }
                        });
                    });
                } else {
                    throw new Error(`Unsupported decorator on ${this.name || this} using ${decorator}`);
                }
            });

            return <any>this;
        }
    }
    return <IODataBase<T, C> & C>ODataBaseClass;
}

export class ODataEntityBase { }
export class ODataEntity extends ODataBase<ODataEntityBase, typeof ODataEntityBase>(ODataEntityBase) { }