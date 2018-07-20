import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import * as url from "url";
import * as qs from "qs";
import * as util from "util";
import * as deepmerge from "deepmerge";
import { Transform, TransformOptions, Readable } from "stream";
import { getFunctionParameters, isIterator, isPromise, isStream } from "./utils";
import { ODataResult } from "./result";
import { ODataController, ODataControllerBase } from "./controller";
import { ResourcePathVisitor, NavigationPart, ODATA_TYPE, ODATA_TYPENAME } from "./visitor";
import * as Edm from "./edm";
import * as odata from "./odata";
import { ResourceNotFoundError, MethodNotAllowedError } from "./error";
import { ODataServer, ODataHttpContext } from "./server";
import { IODataResult } from './index';

const getODataRoot = function (context: ODataHttpContext) {
    return (context.protocol || "http") + "://" + (context.host || "localhost") + (context.base || "");
}

const createODataContext = function (context: ODataHttpContext, entitySets, server: typeof ODataServer, resourcePath, processor) {
    let odataContextBase = getODataRoot(context) + "/$metadata#";
    let odataContext = "";
    let prevResource = null;
    let prevType: any = server;
    let selectContext = "";
    if (processor.query && processor.query.$select) {
        selectContext = `(${processor.query.$select})`;
    }
    resourcePath.navigation.forEach((baseResource, i): string | void => {
        let next = resourcePath.navigation[i + 1];
        let selectContextPart = (i == resourcePath.navigation.length - 1) ? selectContext : "";
        if (next && next.type == TokenType.RefExpression) return;
        if (baseResource.type == TokenType.QualifiedEntityTypeName || baseResource.type == TokenType.QualifiedComplexTypeName) {
            return odataContext += `/${baseResource.name}`;
        }
        if (baseResource.type == TokenType.EntitySetName) {
            prevResource = baseResource;
            prevType = baseResource.key ? entitySets[baseResource.name].prototype.elementType : entitySets[baseResource.name];
            odataContext += baseResource.name;
            odataContext += selectContextPart;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return odataContext += "/$entity";
            if (baseResource.key) {
                if (baseResource.key.length > 1) {
                    return odataContext += "(" + baseResource.key.map((key) => `${key.name}=${decodeURIComponent(key.raw)}`).join(",") + ")";
                } else {
                    return odataContext += "(" + decodeURIComponent(baseResource.key[0].raw) + ")";
                }
            }
        } else if (getResourcePartFunction(baseResource.type) && !(baseResource.name in expCalls)) {
            odataContext = "";
            if (prevResource) {
                let target = prevType || entitySets[prevResource.name];
                if (!target) return;
                let propertyKey = baseResource.name.split(".").pop();
                let returnType = Edm.getReturnType(target, propertyKey, server.container);
                let returnTypeName = Edm.getReturnTypeName(target, propertyKey, server.container);
                if (typeof returnType == "function") {
                    prevType = returnType;
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets) {
                        if (entitySets[prop] == ctrl) {
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? selectContextPart : selectContextPart + "/$entity") : returnTypeName;
                } else returnType = returnTypeName;
                return odataContext += returnType;
            } else {
                let call = baseResource.name;
                let returnType = Edm.getReturnType(server, call, server.container);
                let returnTypeName = Edm.getReturnTypeName(server, call, server.container);
                if (typeof returnType == "function") {
                    prevType = returnType;
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets) {
                        if (entitySets[prop] == ctrl) {
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? selectContextPart : selectContextPart + "/$entity") : returnTypeName;
                } else returnType = returnTypeName;
                return odataContext += returnType;
            }
        }
        if (baseResource.type == TokenType.EntityCollectionNavigationProperty) {
            prevResource = baseResource;
            odataContext += "/" + baseResource.name;
            prevType = baseResource.key ? Edm.getType(prevType, baseResource.name, server.container) : server.getController(<Function>Edm.getType(prevType, baseResource.name, server.container));
            let ctrl = server.getController(prevType);
            let entitySet = null;
            for (let prop in entitySets) {
                if (entitySets[prop] == ctrl) {
                    entitySet = prop;
                    break;
                }
            }
            if (entitySet) odataContext = entitySet;
            odataContext += selectContextPart;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return odataContext += "/$entity";
            if (baseResource.key) {
                if (baseResource.key.length > 1) {
                    return odataContext += "(" + baseResource.key.map((key) => `${key.name}=${decodeURIComponent(key.raw)}`).join(",") + ")";
                } else {
                    return odataContext += "(" + decodeURIComponent(baseResource.key[0].raw) + ")";
                }
            }
            return odataContext;
        }
        if (baseResource.type == TokenType.EntityNavigationProperty) {
            prevResource = baseResource;
            prevType = Edm.getType(prevType, baseResource.name, server.container);
            let ctrl = server.getController(prevType);
            let entitySet = null;
            for (let prop in entitySets) {
                if (entitySets[prop] == ctrl) {
                    entitySet = prop;
                    break;
                }
            }
            return entitySet ? odataContext = entitySet + selectContextPart + "/$entity" : odataContext += "/" + baseResource.name;
        }
        if (baseResource.type == TokenType.PrimitiveProperty ||
            baseResource.type == TokenType.PrimitiveCollectionProperty ||
            baseResource.type == TokenType.ComplexProperty ||
            baseResource.type == TokenType.ComplexCollectionProperty) {
            prevType = Edm.getType(prevType, baseResource.name, server.container);
            return odataContext += "/" + baseResource.name;
        }
    });
    return odataContextBase + odataContext;
}

const fnCaller = function (this: any, fn, params) {
    params = params || {};
    let fnParams: any[];
    fnParams = getFunctionParameters(fn);
    for (var i = 0; i < fnParams.length; i++) {
        fnParams[i] = params[fnParams[i]];
    }
    return fn.apply(this, fnParams);
};

const ODataRequestMethods: string[] = ["get", "post", "put", "patch", "delete"];
const ODataRequestResult: any = {
    get: ODataResult.Ok,
    post: ODataResult.Created,
    put: (result, contentType) => {
        return (result ? ODataResult.Created : ODataResult.NoContent)(result, contentType);
    },
    patch: ODataResult.NoContent,
    delete: ODataResult.NoContent
};

const expCalls = {
    $count: function (this: ODataResult) {
        return this.body && this.body.value ? (this.body.value.length || 0) : 0;
    },
    $value: async function (this: ODataResult, processor) {
        try{
            let prevPart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 2];

            let fn = odata.findODataMethod(processor.ctrl, `${processor.method}/${prevPart.name}/$value`, prevPart.key || []);
            if (!fn && typeof this.elementType == "function" && Edm.isMediaEntity(this.elementType)) {
                fn = odata.findODataMethod(processor.ctrl, `${processor.method}/$value`, prevPart.key || []);
            }
            if (fn) {
                let ctrl = processor.ctrl;
                let params = {};
                if (prevPart.key) prevPart.key.forEach((key) => params[key.name] = key.value);

                let fnDesc = fn;
                await processor.__applyParams(ctrl, fnDesc.call, params, processor.url.query, this);

                fn = ctrl.prototype[fnDesc.call];
                if (fnDesc.key.length == 1 && prevPart.key.length == 1 && fnDesc.key[0].to != prevPart.key[0].name) {
                    params[fnDesc.key[0].to] = params[prevPart.key[0].name];
                    delete params[prevPart.key[0].name];
                } else {
                    for (let i = 0; i < fnDesc.key.length; i++) {
                        if (fnDesc.key[i].to != fnDesc.key[i].from) {
                            params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                            delete params[fnDesc.key[i].from];
                        }
                    }
                }

                let currentResult = fnCaller.call(ctrl, fn, params);

                if (isIterator(fn)) {
                    currentResult = run(currentResult, defaultHandlers);
                }

                if (!isPromise(currentResult)) {
                    currentResult = Promise.resolve(currentResult);
                }

                if (prevPart.type == "PrimitiveProperty" || prevPart.type == "PrimitiveKeyProperty") return currentResult.then(value => value.toString());
                return currentResult;
            } else {
                if (this.stream) return Promise.resolve(this.stream);
                if (this.body) {
                    let result = this.body.value || this.body;
                    for (let prop in result) {
                        if (prop.indexOf("@odata") >= 0) delete result[prop];
                    }

                    result = (<IODataResult>result).value || result;
                    if (typeof result == "object" && (prevPart.type == "PrimitiveProperty" || prevPart.type == "PrimitiveKeyProperty")) return Promise.resolve(result.toString());
                    return Promise.resolve(result);
                }
            }
        }catch(err){
            return Promise.reject(err);
        }
    },
    $ref: async function (this: any, processor) {
        try{
            let prevPart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 2];
            let routePart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 3];

            let fn = odata.findODataMethod(processor.prevCtrl, processor.method + "/" + prevPart.name + "/$ref", routePart.key || []);
            if (processor.method == "get") {
                return {
                    "@odata.context": `${getODataRoot(processor.context)}/$metadata#$ref`,
                    "@odata.id": `${this.body["@odata.id"]}/${prevPart.name}`
                };
            }
            if (!fn) throw new ResourceNotFoundError();

            let linkUrl = (processor.resourcePath.id || (processor.body || {})["@odata.id"] || "").replace(getODataRoot(processor.context), "");
            let linkAst, linkPath, linkPart;
            if (linkUrl) {
                linkUrl = decodeURIComponent(linkUrl);
                processor.emit("header", { "OData-EntityId": linkUrl });
                linkAst = processor.serverType.parser.odataUri(linkUrl, { metadata: processor.serverType.$metadata().edmx });
                linkPath = await new ResourcePathVisitor(processor.serverType, processor.entitySets).Visit(linkAst);
                linkPart = linkPath.navigation[linkPath.navigation.length - 1];
            } else linkPart = prevPart;

            let ctrl = processor.prevCtrl;
            let params = {};
            if (routePart.key) routePart.key.forEach((key) => params[key.name] = key.value);

            let fnDesc = fn;
            await processor.__applyParams(ctrl, fnDesc.call, params, processor.url.query, this);

            fn = ctrl.prototype[fnDesc.call];
            if (fnDesc.key.length == 1 && routePart.key.length == 1 && fnDesc.key[0].to != routePart.key[0].name) {
                params[fnDesc.key[0].to] = params[routePart.key[0].name];
                delete params[routePart.key[0].name];
            } else {
                for (let i = 0; i < fnDesc.key.length; i++) {
                    if (fnDesc.key[i].to != fnDesc.key[i].from) {
                        params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                        delete params[fnDesc.key[i].from];
                    }
                }
            }

            let linkParams = {};
            if (linkPart.key) linkPart.key.forEach((key) => linkParams[key.name] = key.value);

            if (fnDesc.link.length == 1 && linkPart.key.length == 1 && fnDesc.link[0].to != linkPart.key[0].name) {
                params[fnDesc.link[0].to] = linkParams[linkPart.key[0].name];
            } else {
                for (let i = 0; i < fnDesc.link.length; i++) {
                    params[fnDesc.link[i].to] = linkParams[fnDesc.link[i].from];
                }
            }

            let currentResult = fnCaller.call(ctrl, fn, params);

            if (isIterator(fn)) {
                currentResult = run(currentResult, defaultHandlers);
            }

            if (!isPromise(currentResult)) {
                currentResult = Promise.resolve(currentResult);
            }

            return currentResult;
        }catch(err){
            return Promise.reject(err);
        }
    }
};

const getResourcePartFunction = (type) => {
    switch (type) {
        case "PrimitiveFunctionImportCall":
        case "PrimitiveCollectionFunctionImportCall":
        case "ComplexFunctionImportCall":
        case "ComplexCollectionFunctionImportCall":
        case "EntityFunctionImportCall":
        case "EntityCollectionFunctionImportCall":
        case "ActionImportCall":
        case "ActionImport":
            return "__actionOrFunctionImport";
        case "BoundPrimitiveFunctionCall":
        case "BoundPrimitiveCollectionFunctionCall":
        case "BoundComplexFunctionCall":
        case "BoundComplexCollectionFunctionCall":
        case "BoundEntityFunctionCall":
        case "BoundEntityCollectionFunctionCall":
        case "BoundActionCall":
        case "BoundAction":
        case "CountExpression":
        case "ValueExpression":
        case "RefExpression":
            return "__actionOrFunction";
        default:
            return null;
    }
};

const jsPrimitiveTypes = [
    Object,
    String,
    Boolean,
    Number,
    Date
];

const writeMethods = [
    "delete",
    "post",
    "put",
    "patch"
];

export type GeneratorAction = (value?) => any;
export type PromiseGeneratorHandler = Promise<any> | void;

export namespace ODataGeneratorHandlers {
    export function PromiseHandler(request: any, next: GeneratorAction): PromiseGeneratorHandler {
        if (isPromise(request)) {
            return request.then(next);
        }
    }

    export function StreamHandler(request: any, next: GeneratorAction): PromiseGeneratorHandler {
        if (isStream(request)) {
            return new Promise((resolve, reject) => {
                request.on("end", resolve);
                request.on("error", reject);
            }).then(next);
        }
    }

    export function GeneratorHandler(request: any, next: GeneratorAction): PromiseGeneratorHandler {
        if (isIterator(request)) {
            return run(request(), defaultHandlers).then(next);
        }
    }
}
const defaultHandlers = [
    ODataGeneratorHandlers.GeneratorHandler,
    ODataGeneratorHandlers.PromiseHandler,
    ODataGeneratorHandlers.StreamHandler
];

function run(iterator, handlers) {
    function id(x) { return x; }
    function iterate(value?) {
        let next = iterator.next(value);
        let request = next.value;
        let nextAction = next.done ? id : iterate;

        for (let handler of handlers) {
            let action = handler(request, nextAction);
            if (typeof action != "undefined") return action;
        }
        return nextAction(request);
    }
    return iterate();
}

class ODataStreamWrapper extends Transform {
    buffer: any[];

    constructor() {
        super(<TransformOptions>{
            objectMode: true
        });
        this.buffer = [];
    }

    _transform(chunk: any, _: string, done: Function) {
        this.buffer.push(chunk);
        if (typeof done == "function") done();
    }

    protected _flush(done?: Function) {
        if (typeof done == "function") done();
    }

    toPromise():Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.on("finish", () => {
                resolve(this.buffer);
            });
            this.on("error", reject);
        });
    }
}

class StreamWrapper {
    stream: any
    constructor(value) {
        this.stream = value;
    }
}

export enum ODataMetadataType {
    minimal,
    full,
    none
}

export interface ODataProcessorOptions {
    disableEntityConversion: boolean
    metadata: ODataMetadataType
    objectMode: boolean
}

export class ODataProcessor extends Transform {
    private serverType: typeof ODataServer
    private options: ODataProcessorOptions
    private ctrl: typeof ODataController
    private prevCtrl: typeof ODataController
    private instance: ODataController
    private resourcePath: ResourcePathVisitor
    private workflow: any[]
    private context: ODataHttpContext
    private method: string
    private url: any
    private query: any
    private entitySets: {
        [entitySet: string]: typeof ODataController
    }
    private odataContext: string
    private body: any
    private streamStart = false;
    private streamEnabled = false;
    private streamObject = false;
    private streamEnd = false;
    private streamInlineCount: number;
    private elementType: any;
    private resultCount = 0;

    constructor(context, server, options?: ODataProcessorOptions) {
        super(<TransformOptions>{
            objectMode: true
        });

        this.context = context;
        this.serverType = server;
        this.options = options || <ODataProcessorOptions>{};

        let method = this.method = context.method.toLowerCase();
        if (ODataRequestMethods.indexOf(method) < 0) throw new MethodNotAllowedError();

        context.url = decodeURIComponent(context.url);
        this.url = url.parse(context.url);
        this.query = qs.parse(this.url.query);
        let ast = this.serverType.parser.odataUri(context.url, { metadata: this.serverType.$metadata().edmx });
        if (this.serverType.validator) {
            this.serverType.validator(ast);
        }
        let entitySets = this.entitySets = odata.getPublicControllers(this.serverType);

        this.workflow = [async (body) => {
            let resourcePath = this.resourcePath = await new ResourcePathVisitor(this.serverType, this.entitySets).Visit(ast);
            this.odataContext = createODataContext(context, entitySets, server, resourcePath, this);

            if (resourcePath.navigation.length == 0) throw new ResourceNotFoundError();
            this.workflow.push(...resourcePath.navigation.map((part, i) => {
                let next = resourcePath.navigation[i + 1];
                if (next && next.type == TokenType.RefExpression) return null;
                let fn = getResourcePartFunction(part.type) || ("__" + part.type);
                switch (fn) {
                    case "__actionOrFunction":
                        return this.__actionOrFunction.call(this, part);
                    case "__actionOrFunctionImport":
                        return this.__actionOrFunctionImport.call(this, part);
                    case "__QualifiedEntityTypeName":
                    case "__QualifiedComplexTypeName":
                        return this.__qualifiedTypeName.call(this, part);
                    case "__PrimitiveKeyProperty":
                    case "__PrimitiveCollectionProperty":
                    case "__ComplexProperty":
                    case "__ComplexCollectionProperty":
                    case "__PrimitiveProperty":
                        return this.__PrimitiveProperty.call(this, part);
                    case "__EntitySetName":
                        return this.__EntitySetName.call(this, part);
                    case "__EntityCollectionNavigationProperty":
                        return this.__EntityCollectionNavigationProperty.call(this, part);
                    case "__EntityNavigationProperty":
                        return this.__EntityNavigationProperty.call(this, part);
                    default:
                        return null;
                }
            }).filter(it => !!it));

            this.workflow.push((result) => {
                if (result && result.statusCode && result.statusCode == 201) {
                    this.emit("header", {
                        "Location": result.body["@odata.id"]
                    });
                }
                return Promise.resolve(result);
            });

            return body;
        }];
    }

    _transform(chunk: any, _: string, done: Function) {
        if (this.streamEnabled) {
            if (!(chunk instanceof Buffer)) {
                this.streamObject = true;
                if (!this.streamStart) {
                    if (!this.options.objectMode) {
                        this.push("{");
                        if (this.options.metadata != ODataMetadataType.none) {
                            this.push(`"@odata.context":"${this.odataContext}",`);
                        }
                        this.push('"value":[');
                    }
                } else if (!this.options.objectMode && this.resultCount > 0) this.push(',');
                try {
                    this.streamStart = true;
                    if (chunk instanceof Object) {
                        if (chunk["@odata.count"] || chunk.inlinecount) {
                            this.streamInlineCount = chunk["@odata.count"] || chunk.inlinecount;
                            if (Object.keys(chunk).length == 1) {
                                return typeof done == "function" ? done() : null;
                            } else {
                                delete chunk["@odata.count"];
                                delete chunk.inlinecount;
                            }
                        }
                        let entity = {};
                        let defer;
                        if (this.ctrl) defer = this.__appendLinks(this.ctrl, this.elementType || this.ctrl.prototype.elementType, entity, chunk);
                        let deferConvert = this.__convertEntity(entity, chunk, this.elementType || this.ctrl.prototype.elementType, this.resourcePath.includes, this.resourcePath.select);
                        defer = defer ? defer.then(_ => deferConvert) : deferConvert;
                        defer.then(() => {
                            chunk = this.options.objectMode ? entity : JSON.stringify(entity);
                            this.push(chunk);
                            this.resultCount++;
                            if (typeof done == "function") done();
                        }, (err) => {
                            console.log(err);
                            if (typeof done == "function") done(err);
                        });
                    } else {
                        this.push(JSON.stringify(chunk));
                        this.resultCount++;
                        if (typeof done == "function") done();
                    }
                } catch (err) {
                    console.log(err);
                    if (typeof done == "function") done(err);
                }
            } else {
                this.streamStart = true;
                this.push(chunk);
                this.resultCount++;
                if (typeof done == "function") done();
            }
        } else {
            this.resultCount++;
            if (typeof done == "function") done();
        }
    }

    protected _flush(done?: Function) {
        if (this.streamEnabled && this.streamObject) {
            if (this.options.objectMode) {
                let flushObject: any = {
                    value: [],
                    elementType: this.elementType || this.ctrl.prototype.elementType
                };
                if (this.options.metadata != ODataMetadataType.none) {
                    flushObject["@odata.context"] = this.odataContext;
                }
                if (this.streamStart && typeof this.streamInlineCount == "number") {
                    flushObject["@odata.count"] = this.streamInlineCount;
                }
                this.push(flushObject);
            } else {
                if (this.streamStart) {
                    if (typeof this.streamInlineCount == "number") {
                        this.push(`],"@odata.count":${this.streamInlineCount}}`);
                    } else this.push("]}");
                } else {
                    if (this.options.metadata == ODataMetadataType.none) {
                        this.push('{"value":[]}');
                    } else {
                        this.push(`{"@odata.context":"${this.odataContext}","value":[]}`);
                    }
                }
            }
        } else if (this.streamEnabled && !this.streamStart) {
            if (this.options.metadata == ODataMetadataType.none) {
                this.push('{"value":[]}');
            } else {
                this.push(`{"@odata.context":"${this.odataContext}","value":[]}`);
            }
        }
        this.streamEnd = true;
        if (typeof done == "function") done();
    }

    private __qualifiedTypeName(part: NavigationPart): Function {
        return (result) => {
            result.elementType = part.node[ODATA_TYPE];
            return result;
        };
    }

    private __EntityCollectionNavigationProperty(part: NavigationPart): Function {
        return async (result) => {
            try{
                let resultType = result.elementType;
                let elementType = <Function>Edm.getType(resultType, part.name, this.serverType.container);
                let partIndex = this.resourcePath.navigation.indexOf(part);
                let method = writeMethods.indexOf(this.method) >= 0 && partIndex < this.resourcePath.navigation.length - 1
                    ? "get"
                    : this.method;
                let fn: any = odata.findODataMethod(this.ctrl, `${method}/${part.name}`, part.key);
                if (fn) {
                    let ctrl = this.ctrl;
                    let fnDesc = fn;
                    let params = {};
                    if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                    await this.__applyParams(ctrl, fnDesc.call, params, this.url.query, result);
                    fn = ctrl.prototype[fnDesc.call];
                    if (fnDesc.key.length == 1 && part.key.length == 1 && fnDesc.key[0].to != part.key[0].name) {
                        params[fnDesc.key[0].to] = params[part.key[0].name];
                        delete params[part.key[0].name];
                    } else {
                        for (let i = 0; i < fnDesc.key.length; i++) {
                            if (fnDesc.key[i].to != fnDesc.key[i].from) {
                                params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                                delete params[fnDesc.key[i].from];
                            }
                        }
                    }
                    if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                    this.elementType = elementType;
                    return this.__read(ctrl, part, params, result, fn, elementType).then((result) => {
                        this.ctrl = this.serverType.getController(elementType);
                        return result;
                    });
                } else {
                    let ctrl = this.serverType.getController(elementType);
                    let foreignKeys = Edm.getForeignKeys(resultType, part.name);
                    let typeKeys = Edm.getKeyProperties(resultType);
                    result.foreignKeys = {};
                    let foreignFilter = (await Promise.all(foreignKeys.map(async key => {
                        result.foreignKeys[key] = result.body[typeKeys[0]];
                        return `${key} eq ${await Edm.escape(result.body[typeKeys[0]], Edm.getTypeName(elementType, key, this.serverType.container))}`;
                    }))).join(" and ");
                    let params = {};
                    if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                    return this.__read(ctrl, part, params, result, foreignFilter);
                }
            }catch(err){
                return Promise.reject(err);
            }
        };
    }

    private __EntityNavigationProperty(part: NavigationPart): Function {
        return async (result) => {
            try{
                let resultType = result.elementType;
                let elementType = <Function>Edm.getType(resultType, part.name, this.serverType.container);
                let partIndex = this.resourcePath.navigation.indexOf(part);
                let method = writeMethods.indexOf(this.method) >= 0 && partIndex < this.resourcePath.navigation.length - 1
                    ? "get"
                    : this.method;
                let fn: any = odata.findODataMethod(this.ctrl, `${method}/${part.name}`, part.key);
                if (fn) {
                    let ctrl = this.ctrl;
                    let fnDesc = fn;
                    let params = {};
                    if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                    await this.__applyParams(ctrl, fnDesc.call, params, this.url.query, result);
                    fn = ctrl.prototype[fnDesc.call];
                    if (fnDesc.key.length == 1 && part.key.length == 1 && fnDesc.key[0].to != part.key[0].name) {
                        params[fnDesc.key[0].to] = params[part.key[0].name];
                        delete params[part.key[0].name];
                    } else {
                        for (let i = 0; i < fnDesc.key.length; i++) {
                            if (fnDesc.key[i].to != fnDesc.key[i].from) {
                                params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                                delete params[fnDesc.key[i].from];
                            }
                        }
                    }
                    this.elementType = elementType;
                    return this.__read(ctrl, part, params, result, fn, elementType).then((result) => {
                        this.ctrl = this.serverType.getController(elementType);
                        return result;
                    });
                } else {
                    let ctrl = this.serverType.getController(elementType);
                    let foreignKeys = Edm.getForeignKeys(resultType, part.name);
                    result.foreignKeys = {};
                    (<any>part).key = foreignKeys.map((key) => {
                        result.foreignKeys[key] = result.body[key];
                        return {
                            name: key,
                            value: result.body[key]
                        };
                    });
                    let params = {};
                    if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                    return this.__read(ctrl, part, params, result);
                }
            }catch(err){
                return Promise.reject(err);
            }
        };
    }

    private __PrimitiveProperty(part: NavigationPart): Function {
        return async (result) => {
            try{
                return new Promise(async (resolve, reject) => {
                    this.__enableStreaming(part);

                    let currentResult;
                    let prevPart = this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) - 1];
                    let fn = odata.findODataMethod(this.ctrl, `${this.method}/${part.name}`, prevPart.key || []) ||
                        odata.findODataMethod(this.ctrl, `${this.method}/${part.name}/$value`, prevPart.key || []);
                    if (!fn && this.method != "get") {
                        fn = this.method == "delete"
                            ? odata.findODataMethod(this.ctrl, "patch", prevPart.key || [])
                            : odata.findODataMethod(this.ctrl, `${this.method}`, prevPart.key || []);
                        if (fn) {
                            let body = this.body;
                            if (Edm.getTypeName(result.elementType, part.name, this.serverType.container) != "Edm.Stream") body = body.body || body;
                            this.body = {};
                            this.body[part.name] = this.method == "delete" ? null : body.value || body;
                        }
                    }
                    if (fn) {
                        let ctrl = this.prevCtrl;
                        let params = {};
                        if (prevPart.key) prevPart.key.forEach((key) => params[key.name] = key.value);

                        let fnDesc = fn;
                        await this.__applyParams(ctrl, fnDesc.call, params, this.url.query, result);

                        fn = ctrl.prototype[fnDesc.call];
                        if (fnDesc.key.length == 1 && prevPart.key.length == 1 && fnDesc.key[0].to != prevPart.key[0].name) {
                            params[fnDesc.key[0].to] = params[prevPart.key[0].name];
                            delete params[prevPart.key[0].name];
                        } else {
                            for (let i = 0; i < fnDesc.key.length; i++) {
                                if (fnDesc.key[i].to != fnDesc.key[i].from) {
                                    params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                                    delete params[fnDesc.key[i].from];
                                }
                            }
                        }

                        this.elementType = Edm.getType(result.elementType, part.name, this.serverType.container) || Object;
                        if (typeof this.elementType == "string") this.elementType = Object;
                        currentResult = fnCaller.call(ctrl, fn, params);

                        if (isIterator(fn)) {
                            currentResult = run(currentResult, defaultHandlers);
                        }

                        if (!isPromise(currentResult)) {
                            currentResult = Promise.resolve(currentResult);
                        }
                    } else {
                        let value = result.body[part.name];
                        if (value instanceof StreamWrapper) {
                            value = value.stream;
                        }

                        currentResult = Promise.resolve(value);
                    }

                    if (this.method == "get") {
                        currentResult.then((value) => {
                            try {
                                result.body = {
                                    "@odata.context": this.options.metadata != ODataMetadataType.none ? result.body["@odata.context"] : undefined,
                                    value: value
                                };
                                let elementType = result.elementType;
                                //if (value instanceof Object)
                                result.elementType = Edm.isEnumType(result.elementType, part.name)
                                    ? Edm.getTypeName(result.elementType, part.name, this.serverType.container)
                                    : Edm.getType(result.elementType, part.name, this.serverType.container) || Object;

                                if (value && (isStream(value) || isStream(value.stream))) {
                                    this.emit("header", { "Content-Type": Edm.getContentType(elementType.prototype, part.name) || value.contentType || "application/octet-stream" });
                                    if (value.stream) value = value.stream;
                                    value.pipe(this);
                                    value.on("end", resolve);
                                    value.on("error", reject);
                                } else {
                                    if (this.streamEnabled && this.streamStart) delete result.body;
                                    if (result.stream) delete result.stream;
                                    resolve(result);
                                }
                            } catch (err) {
                                console.log(err);
                                reject(err);
                            }
                        }, reject);
                    } else {
                        ODataResult.NoContent(currentResult).then(resolve, reject);
                    }
                });
            }catch(err){
                return Promise.reject(err);
            }
        };
    }

    private __read(ctrl: typeof ODataController, part: any, params: any, data?: any, filter?: string | Function, elementType?: any, include?, select?) {
        return new Promise(async (resolve, reject) => {
            try{
                select = select || this.resourcePath.select;

                if (this.ctrl) this.prevCtrl = this.ctrl;
                else this.prevCtrl = ctrl;
                this.ctrl = ctrl;

                let method = writeMethods.indexOf(this.method) >= 0 &&
                    this.resourcePath.navigation.indexOf(part) < this.resourcePath.navigation.length - 1
                    ? "get"
                    : this.method;

                this.instance = new ctrl();

                let fn;
                if (typeof filter == "string" || !filter) {
                    fn = odata.findODataMethod(ctrl, method, part.key);
                    if (!fn) return reject(new ResourceNotFoundError());

                    let queryString = filter ? `$filter=${filter}` : (include || this.url).query;
                    if (include && filter && include.query && !include.query.$filter) {
                        include.query.$filter = filter;
                        queryString = Object.keys(include.query).map(p => {
                            return `${p}=${include.query[p]}`;
                        }).join("&");
                    } else if ((include && filter && include.query) || (!include && this.resourcePath.navigation.indexOf(part) == this.resourcePath.navigation.length - 1)) {
                        queryString = Object.keys((include || this).query).map(p => {
                            if (p == "$filter" && filter) {
                                (include || this).query[p] = `(${(include || this).query[p]}) and (${filter})`;
                            }
                            return `${p}=${(include || this).query[p]}`;
                        }).join("&") || queryString;
                    }
                    if (queryString && typeof queryString == "object") {
                        queryString = Object.keys(queryString).map(p => {
                            return `${p}=${queryString[p]}`;
                        }).join("&");
                    }

                    if (typeof fn != "function") {
                        let fnDesc = fn;
                        fn = ctrl.prototype[fnDesc.call];
                        if (fnDesc.key.length == 1 && part.key.length == 1 && fnDesc.key[0].to != part.key[0].name) {
                            params[fnDesc.key[0].to] = params[part.key[0].name];
                            delete params[part.key[0].name];
                        } else {
                            for (let i = 0; i < fnDesc.key.length; i++) {
                                if (fnDesc.key[i].to != fnDesc.key[i].from) {
                                    params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                                    delete params[fnDesc.key[i].from];
                                }
                            }
                        }
                        await this.__applyParams(ctrl, fnDesc.call, params, queryString, undefined, include);
                    } else await this.__applyParams(ctrl, method, params, queryString, undefined, include);
                } else fn = filter;

                if (!include) this.__enableStreaming(part);

                let currentResult: any;
                switch (method) {
                    case "get":
                    case "delete":
                        currentResult = fnCaller.call(ctrl, fn, params);
                        break;
                    case "post":
                        this.odataContext += "/$entity";
                    case "put":
                    case "patch":
                        let body = data ? Object.assign(this.body || {}, data.foreignKeys) : this.body;
                        let bodyParam = odata.getBodyParameter(ctrl, fn.name);
                        let typeParam = odata.getTypeParameter(ctrl, fn.name);
                        if (typeParam) {
                            params[typeParam] = (body["@odata.type"] || (`${(<any>ctrl.prototype.elementType).namespace}.${(<any>ctrl.prototype.elementType).name}`)).replace(/^#/, "");
                        }
                        if (bodyParam) {
                            await this.__deserialize(body, ctrl.prototype.elementType);
                            this.__stripOData(body);
                            params[bodyParam] = body;
                        }
                        if (!part.key) {
                            let properties: string[] = Edm.getProperties((elementType || ctrl.prototype.elementType).prototype);
                            properties.forEach((prop) => {
                                if (Edm.isKey(elementType || ctrl.prototype.elementType, prop)) {
                                    params[prop] = (this.body || {})[prop] || ((data || {}).body || {})[prop];
                                }
                            });
                        }
                        currentResult = fnCaller.call(ctrl, fn, params);
                        break;
                }

                if (isIterator(fn)) {
                    currentResult = run(currentResult, defaultHandlers);
                }

                if (!isPromise(currentResult)) {
                    currentResult = Promise.resolve(currentResult);
                }

                return currentResult.then((result: any): any => {
                    if (isStream(result) && include) {
                        include.streamPromise.then((result) => {
                            (<Promise<ODataResult>>ODataRequestResult[method](result)).then((result) => {
                                if (elementType) result.elementType = elementType;
                                return this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType, (include || this.resourcePath).includes, select).then(() => {
                                    resolve(result);
                                }, reject);
                            }, reject);
                        }, reject);
                    } else if (isStream(result) && (!part.key || !Edm.isMediaEntity(elementType || this.ctrl.prototype.elementType))) {
                        result.on("end", () => resolve(ODataRequestResult[method]()));
                        result.on("error", reject);
                    } else if (!(result instanceof ODataResult)) {
                        return (<Promise<ODataResult>>ODataRequestResult[method](result)).then((result) => {
                            if (!this.streamStart &&
                                writeMethods.indexOf(this.method) < 0 && !result.body) return reject(new ResourceNotFoundError());
                            try {
                                if (elementType) result.elementType = elementType;
                                this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType, (include || this.resourcePath).includes, select).then(() => {
                                    if (!this.streamEnd && this.streamEnabled && this.streamStart) this.on("end", () => resolve(result));
                                    else resolve(result);
                                }, reject);
                            } catch (err) {
                                reject(err);
                            }
                        }, reject);
                    } else {
                        try {
                            if (elementType) result.elementType = elementType;
                            this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType, (include || this.resourcePath).includes, select).then(() => {
                                if (!this.streamEnd && this.streamEnabled && this.streamStart) this.on("end", () => resolve(result));
                                else resolve(result);
                            }, reject);
                        } catch (err) {
                            reject(err);
                        }
                    }
                }, reject);
            }catch(err){
                reject(err);
            }
        });
    }

    private async __deserialize(obj, type) {
        for (let prop in obj) {
            try {
                let propType = Edm.getType(type, prop, this.serverType.container);
                let fn = Edm.getDeserializer(type, prop, propType, this.serverType.container);
                if (typeof fn == "function") {
                    obj[prop] = await fn(obj[prop], prop, propType);
                } else if (typeof obj[prop] == "object") {
                    await this.__deserialize(obj[prop], propType);
                }
            } catch (err) { }
        }
    }

    private __stripOData(obj) {
        for (let prop in obj) {
            if (prop.indexOf("@odata") >= 0)
                delete obj[prop];
            if (typeof obj[prop] == "object") this.__stripOData(obj[prop]);
        }
    }

    private __EntitySetName(part: NavigationPart): Function {
        let ctrl = this.entitySets[part.name];
        let params = {};
        if (part.key) part.key.forEach((key) => params[key.name] = key.value);
        return (data) => {
            return this.__read(ctrl, part, params, data);
        };
    }

    private __actionOrFunctionImport(part: NavigationPart): Function {
        let fn = this.serverType.prototype[part.name];
        return (data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    this.__enableStreaming(part);

                    let returnType = <Function>Edm.getReturnType(this.serverType, part.name, this.serverType.container);
                    let isAction = false;
                    let schemas = this.serverType.$metadata().edmx.dataServices.schemas;
                    if (Edm.isActionImport(this.serverType, part.name) ||
                        schemas.some(schema => schema.entityContainer.some(container => container.actionImports.some(actionImport => actionImport.name == part.name)))
                    ) {
                        isAction = true;
                        part.params = Object.assign(part.params || {}, this.body || {});
                    }
                    await this.__applyParams(this.serverType, part.name, part.params);
                    let result = fnCaller.call(data, fn, part.params);

                    if (isIterator(fn)) {
                        result = run(result, defaultHandlers);
                    }

                    if (isAction && !returnType) {
                        return ODataResult.NoContent(result).then(resolve, reject);
                    } else {
                        return ODataResult.Ok(result).then((result) => {
                            if (isStream(result.body)) {
                                (<any>result.body).on("end", resolve);
                                (<any>result.body).on("error", reject);
                            } else {
                                try {
                                    this.__appendODataContext(result, returnType, this.resourcePath.includes, this.resourcePath.select).then(() => {
                                        resolve(result);
                                    });
                                } catch (err) {
                                    reject(err);
                                }
                            }
                        }, reject);
                    }
                } catch (err) {
                    return Promise.reject(err);
                }
            });
        };
    }

    private __actionOrFunction(part: NavigationPart): Function {
        return (result: ODataResult) => {
            return new Promise(async (resolve, reject) => {
                try{
                    this.__enableStreaming(part);
                    if (!result) return resolve();

                    let boundOpName = part.name.split(".").pop();
                    let elementType = result.elementType;
                    let entityBoundOp = typeof elementType == "function" ? elementType.prototype[boundOpName] : null;
                    let ctrlBoundOp = this.instance[boundOpName];
                    let expOp = expCalls[boundOpName];
                    let scope: any = this.serverType;
                    let returnType: any = Object;
                    let isAction = false;
                    let schemas = this.serverType.$metadata().edmx.dataServices.schemas;
                    if (entityBoundOp) {
                        scope = result.body;
                        returnType = <Function>Edm.getReturnType(elementType, boundOpName, this.serverType.container);
                        if (Edm.isAction(elementType, boundOpName) ||
                            schemas.some(schema =>
                                schema.actions.some(action =>
                                    action.name == boundOpName && action.isBound && action.parameters.some(parameter =>
                                        parameter.name == "bindingParameter" && parameter.type == ((<any>elementType).namespace + "." + (<any>elementType).name))))
                        ) {
                            isAction = true;
                            part.params = Object.assign(part.params || {}, this.body || {});
                        }
                        await this.__applyParams(elementType, boundOpName, part.params, null, result);
                    } else if (ctrlBoundOp) {
                        scope = this.instance;
                        returnType = <Function>Edm.getReturnType(this.ctrl, boundOpName, this.serverType.container);
                        if (Edm.isAction(elementType, boundOpName) ||
                            schemas.some(schema =>
                                schema.actions.some(action =>
                                    action.name == boundOpName && action.isBound && action.parameters.some(parameter =>
                                        parameter.name == "bindingParameter" && parameter.type == "Collection(" + ((<any>elementType).namespace + "." + (<any>elementType).name) + ")")))
                        ) {
                            isAction = true;
                            part.params = Object.assign(part.params || {}, this.body || {});
                        }
                        await this.__applyParams(this.ctrl, boundOpName, part.params, null, result);
                    } else if (expOp) {
                        scope = result;
                        part.params["processor"] = this;
                    }
                    let boundOp = entityBoundOp || ctrlBoundOp || expOp;
                    let opResult = fnCaller.call(scope, boundOp, part.params);

                    if (isIterator(boundOp)) {
                        opResult = run(opResult, defaultHandlers);
                    }

                    if (boundOp == expOp) {
                        let expResult = Promise.resolve(boundOpName == "$count" ? opResult || this.resultCount : opResult);
                        if (elementType && boundOpName == "$value" && typeof elementType == "function" && Edm.isMediaEntity(elementType)) {
                            opResult.then((opResult) => {
                                if (this.method == "get") {
                                    this.emit("header", { "Content-Type": Edm.getContentType(elementType) || opResult.contentType || "application/octet-stream" });
                                    if (opResult.stream) opResult = opResult.stream;
                                    opResult.pipe(this);
                                    opResult.on("end", resolve);
                                    opResult.on("error", reject);
                                } else ODataResult.NoContent().then(resolve, reject);
                            }, reject);
                        } else {
                            return expResult.then((expResult) => {
                                return (<Promise<ODataResult>>(boundOpName == "$ref" && this.method != "get" ? ODataResult.NoContent : ODataRequestResult[this.method])(expResult, typeof expResult == "object" ? "application/json" : "text/plain")).then((result) => {
                                    if (typeof expResult == "object" && (boundOpName != "$ref" || this.method == "get")) result.elementType = elementType;
                                    resolve(result);
                                }, reject);
                            }, reject);
                        }
                    }
                    if (isAction && !returnType) {
                        return ODataResult.NoContent(opResult).then(resolve, reject);
                    }
                    return ODataResult.Ok(opResult).then((result) => {
                        if (isStream(result.body)) {
                            (<any>result.body).on("end", resolve);
                            (<any>result.body).on("error", reject);
                        } else {
                            try {
                                this.__appendODataContext(result, returnType, this.resourcePath.includes, this.resourcePath.select).then(() => {
                                    if (typeof result.body.value == "undefined") result.body.value = opResult;
                                    resolve(result);
                                });
                            } catch (err) {
                                reject(err);
                            }
                        }
                    }, reject);
                } catch (err) {
                    return Promise.reject(err);
                }
            });
        };
    }

    private async __appendLinks(ctrl, elementType, context, body, result?) {
        if (this.options.metadata == ODataMetadataType.none) return;
        let entitySet = this.entitySets[this.resourcePath.navigation[0].name] == ctrl ? this.resourcePath.navigation[0].name : null;
        if (!entitySet) {
            for (let prop in this.entitySets) {
                if (this.entitySets[prop] == ctrl) {
                    entitySet = prop;
                    break;
                }
            }
        }
        let resultType = Object.getPrototypeOf(body).constructor;
        if (resultType != Object && resultType != elementType) elementType = resultType;
        if (typeof body["@odata.type"] == "function") elementType = body["@odata.type"];
        let keys = Edm.getKeyProperties(elementType);
        let resolveBaseType = (elementType) => {
            if (elementType && elementType.prototype) {
                let proto = Object.getPrototypeOf(elementType.prototype);
                if (proto) {
                    let baseType = proto.constructor;
                    if (baseType != Object && Edm.getProperties(baseType.prototype).length > 0) {
                        keys = Edm.getKeyProperties(baseType).concat(keys);
                        resolveBaseType(baseType);
                    }
                }
            }
        };
        resolveBaseType(elementType);
        if (!entitySet || ctrl.prototype.elementType != elementType) {
            let typeCtrl = this.serverType.getController(elementType);
            if (typeCtrl) {
                for (let prop in this.entitySets) {
                    if (this.entitySets[prop] == typeCtrl) {
                        entitySet = prop;
                        break;
                    }
                }
            }
        }
        let id;
        if (keys.length > 0) {
            try {
                if (keys.length == 1) {
                    id = await Edm.escape(
                        body[keys[0]],
                        Edm.getTypeName(elementType, keys[0], this.serverType.container),
                        Edm.getURLSerializer(
                            elementType,
                            keys[0],
                            Edm.getType(elementType, keys[0], this.serverType.container),
                            this.serverType.container
                        ));
                } else {
                    id = (await Promise.all(keys.map(async it =>
                        `${it}=${
                        await Edm.escape(
                            body[it],
                            Edm.getTypeName(elementType, it, this.serverType.container),
                            Edm.getURLSerializer(
                                elementType,
                                it,
                                Edm.getType(elementType, it, this.serverType.container),
                                this.serverType.container
                            ))}`))).join(",");
                }
            } catch (err) { }
        }
        if (entitySet && typeof id != "undefined") {
            context["@odata.id"] = `${getODataRoot(this.context)}/${entitySet}(${id})`;
            if (typeof elementType == "function" && Edm.isMediaEntity(elementType)) {
                context["@odata.mediaReadLink"] = `${getODataRoot(this.context)}/${entitySet}(${id})/$value`;
                if (odata.findODataMethod(ctrl, "post/$value", [])) {
                    context["@odata.mediaEditLink"] = `${getODataRoot(this.context)}/${entitySet}(${id})/$value`;
                }
                let contentType = Edm.getContentType(elementType);
                if (contentType) context["@odata.mediaContentType"] = contentType;
                if (typeof result == "object") {
                    Object.defineProperty(result, "stream", {
                        configurable: true,
                        enumerable: false,
                        writable: false,
                        value: body
                    });
                }
            }
            if (odata.findODataMethod(ctrl, "put", keys) ||
                odata.findODataMethod(ctrl, "patch", keys)) {
                context["@odata.editLink"] = `${getODataRoot(this.context)}/${entitySet}(${id})`;
            }
        } else {
            if (typeof elementType == "function" && Edm.isMediaEntity(elementType)) {
                context["@odata.mediaReadLink"] = `${getODataRoot(this.context)}${this.context.url}(${id})/$value`;
                context["@odata.mediaReadLink"] = context["@odata.mediaReadLink"].replace(`(${id})(${id})`, `(${id})`);
                if (odata.findODataMethod(ctrl, "post/$value", [])) {
                    context["@odata.mediaEditLink"] = `${getODataRoot(this.context)}${this.context.url}(${id})/$value`;
                    context["@odata.mediaEditLink"] = context["@odata.mediaEditLink"].replace(`(${id})(${id})`, `(${id})`);
                }
                let contentType = Edm.getContentType(elementType);
                if (contentType) context["@odata.mediaContentType"] = contentType;
                if (typeof result == "object") {
                    Object.defineProperty(result, "stream", {
                        configurable: true,
                        enumerable: false,
                        writable: false,
                        value: body
                    });
                }
            }
            if (keys.length > 0 && typeof id != "undefined") {
                if (odata.findODataMethod(ctrl, "put", keys) ||
                    odata.findODataMethod(ctrl, "patch", keys)) {
                    context["@odata.editLink"] = `${getODataRoot(this.context)}${this.context.url}(${id})`;
                    context["@odata.editLink"] = context["@odata.editLink"].replace(`(${id})(${id})`, `(${id})`);
                }
            }
        }
    }

    private async __appendODataContext(result: any, ctrlType: Function, includes?, select?) {
        if (typeof result.body == "undefined") return;
        let context: any = {
            "@odata.context": this.options.metadata != ODataMetadataType.none ? this.odataContext : undefined
        };
        let elementType = result.elementType = jsPrimitiveTypes.indexOf(result.elementType) >= 0 || result.elementType == String || typeof result.elementType != "function" ? ctrlType : result.elementType;
        if (typeof result.body == "object" && result.body) {
            if (typeof result.body["@odata.count"] == "number") context["@odata.count"] = result.body["@odata.count"];
            if (!result.body["@odata.context"]) {
                let ctrl = this.ctrl && this.ctrl.prototype.elementType == ctrlType ? this.ctrl : this.serverType.getController(ctrlType);
                if (result.body.value && Array.isArray(result.body.value)) {
                    context.value = [];
                    await Promise.all(result.body.value.map((entity, i) => {
                        return (async (entity, i) => {
                            if (typeof entity == "object") {
                                let item = {};
                                if (ctrl) await this.__appendLinks(ctrl, elementType, item, entity);
                                await this.__convertEntity(item, entity, elementType, includes, select);
                                context.value[i] = item;
                            } else {
                                context.value[i] = entity;
                            }
                        })(entity, i);
                    }));
                } else {
                    if (ctrl) await this.__appendLinks(ctrl, elementType, context, result.body, result);
                    await this.__convertEntity(context, result.body, elementType, includes, select);
                }
            }
        } else if (typeof result.body != "undefined" && result.body) {
            context.value = result.body;
        }
        result.body = context;
    }

    private async __resolveAsync(type, prop, propValue, entity, converter) {
        if (typeof converter == "function") {
            propValue = await converter(propValue, prop, type);
        }
        if (isIterator(propValue)) {
            propValue = await run(propValue.call(entity), defaultHandlers);
        }
        if (typeof propValue == "function") propValue = propValue.call(entity);
        if (isPromise(propValue)) propValue = await propValue;
        if (type != "Edm.Stream" && isStream(propValue)) {
            let stream = new ODataStreamWrapper();
            (<Readable>propValue).pipe(stream);
            propValue = await stream.toPromise();
        }
        return propValue;
    }

    private __setODataType(context, elementType) {
        let containerType = this.serverType.container.resolve(elementType);
        if (containerType) {
            context["@odata.type"] = `#${odata.getNamespace(Object.getPrototypeOf(this.serverType.container).constructor, containerType) || (this.serverType.container["namespace"] || elementType.namespace || this.serverType.namespace)}.${containerType}`;
        } else {
            context["@odata.type"] = `#${(elementType.namespace || this.serverType.namespace)}.${elementType.name}`;
        }
    }

    private async __convertEntity(context, result, elementType, includes?, select?) {
        if (!(elementType.prototype instanceof Object) || elementType === Object || this.options.disableEntityConversion) return Object.assign(context, result || {});
        let resultType = Object.getPrototypeOf(result).constructor;
        if (resultType != Object && resultType != this.ctrl.prototype.elementType && resultType.prototype instanceof this.ctrl.prototype.elementType) {
            elementType = resultType;
            if (this.options.metadata != ODataMetadataType.none && Edm.isEntityType(elementType)) this.__setODataType(context, elementType);
        }
        if (typeof result["@odata.type"] == "function") {
            elementType = result["@odata.type"];
            if (this.options.metadata != ODataMetadataType.none && Edm.isEntityType(elementType)) this.__setODataType(context, elementType);
        }
        if (this.options.metadata == ODataMetadataType.full) {
            this.__setODataType(context, elementType);
        }
        let props = Edm.getProperties(elementType.prototype);
        if (Edm.isOpenType(elementType)) {
            props = Object.getOwnPropertyNames(result).concat(props);
        }
        let ctrl = this.serverType.getController(elementType);
        let resolveBaseType = (elementType) => {
            if (elementType && elementType.prototype) {
                let proto = Object.getPrototypeOf(elementType.prototype);
                if (proto) {
                    let baseType = proto.constructor;
                    if (baseType != Object && Edm.getProperties(baseType.prototype).length > 0) {
                        props = Edm.getProperties(baseType.prototype).concat(props);
                        ctrl = ctrl || this.serverType.getController(baseType);
                        resolveBaseType(baseType);
                    }
                }
            }
        };
        resolveBaseType(elementType);
        let entityType = function () { };
        util.inherits(entityType, elementType);
        result = Object.assign(new entityType(), result || {});

        if (includes) {
            for (let expand in includes) {
                let include = includes[expand];
                for (let nav of include.navigation) {
                    if (nav.type == TokenType.EntityNavigationProperty || nav.type == TokenType.EntityCollectionNavigationProperty && !includes[nav.name]) {
                        includes[nav.name] = include;
                    }
                }
            }
        }

        if (props.length > 0) {
            let metadata = {};
            await Promise.all(props.map(prop => (async prop => {
                let type: any = Edm.getType(elementType, prop, this.serverType.container);
                let itemType;
                if (typeof type == "function" && !Edm.isTypeDefinition(elementType, prop)) {
                    itemType = function () { };
                    util.inherits(itemType, type);
                }
                let converter: Function = Edm.getSerializer(elementType, prop, type, this.serverType.container) || Edm.getConverter(elementType, prop);
                let isCollection = Edm.isCollection(elementType, prop);
                let entity = result;
                let propValue = entity[prop];

                propValue = await this.__resolveAsync(type, prop, propValue, entity, converter);
                if (select && Object.keys(select).length == 0){
                    select = null;
                }

                if (!select || (select && select[prop]) || (includes && includes[prop])){
                    if (isCollection && propValue) {
                        let value = Array.isArray(propValue) ? propValue : (typeof propValue != "undefined" ? [propValue] : []);
                        for (let i = 0; i < value.length; i++) {
                            value[i] = await this.__resolveAsync(type, prop, value[i], entity, converter);
                        }
                        if (includes && includes[prop]) {
                            await this.__include(includes[prop], (select || {})[prop], context, prop, ctrl, entity, elementType);
                        } else if (typeof type == "function" && !Edm.isTypeDefinition(elementType, prop)) {
                            for (let i = 0; i < value.length; i++) {
                                let it = value[i];
                                if (!it) return it;
                                let item = new itemType();
                                await this.__convertEntity(item, it, type, includes, (select || {})[prop]);
                                value[i] = item;
                            }
                        }
                        context[prop] = value;
                    } else {
                        if (this.options.metadata == ODataMetadataType.full) {
                            if (Edm.isEntityType(elementType, prop)) {
                                if ((!includes || (includes && !includes[prop]))) {
                                    metadata[`${prop}@odata.associationLink`] = `${context["@odata.id"]}/${prop}/$ref`;
                                    metadata[`${prop}@odata.navigationLink`] = `${context["@odata.id"]}/${prop}`;
                                }
                            } else if (type != "Edm.String" && type != "Edm.Boolean") {
                                let typeName = Edm.getTypeName(elementType, prop, this.serverType.container);
                                if (typeof type == "string" && type.indexOf("Edm.") == 0) typeName = typeName.replace(/Edm\./, "");
                                context[`${prop}@odata.type`] = `#${typeName}`;
                            }
                        }
                        if (includes && includes[prop]) {
                            await this.__include(includes[prop], (select || {})[prop], context, prop, ctrl, entity, elementType);
                        } else if (typeof type == "function" && propValue && !Edm.isTypeDefinition(elementType, prop)) {
                            context[prop] = new itemType();
                            await this.__convertEntity(context[prop], propValue, type, includes, (select || {})[prop]);
                        } else if (type == "Edm.Stream") {
                            if (this.options.metadata != ODataMetadataType.none) {
                                context[`${prop}@odata.mediaReadLink`] = `${context["@odata.id"]}/${prop}`;
                                if (odata.findODataMethod(ctrl, `post/${prop}`, []) || odata.findODataMethod(ctrl, `post/${prop}/$value`, [])) {
                                    context[`${prop}@odata.mediaEditLink`] = `${context["@odata.id"]}/${prop}`;
                                }
                                let contentType = Edm.getContentType(elementType.prototype, prop) || (propValue && propValue.contentType);
                                if (contentType) context[`${prop}@odata.mediaContentType`] = contentType;
                            }
                            Object.defineProperty(context, prop, {
                                configurable: true,
                                enumerable: false,
                                writable: false,
                                value: new StreamWrapper(propValue)
                            });
                        } else if (typeof propValue != "undefined") context[prop] = propValue;
                    }
                }
            })(prop)));
            Object.assign(context, metadata);
        }
    }

    private async __include(include: ResourcePathVisitor, select, context, prop, ctrl: typeof ODataController, result, elementType) {
        let oldPrevCtrl = this.prevCtrl;
        let oldCtrl = this.ctrl;
        const isCollection = Edm.isCollection(elementType, include.navigationProperty);
        const navigationType = <Function>Edm.getType(elementType, include.navigationProperty, this.serverType.container);
        let navigationResult;
        if (typeof result[prop] == "object") {
            navigationResult = await ODataResult.Ok(result[prop]);
            await this.__appendODataContext(navigationResult, navigationType, include.includes, select);
            ctrl = this.serverType.getController(navigationType);
        } else {
            const fn = odata.findODataMethod(ctrl, `get/${include.navigationProperty}`, []);
            let params = {};
            let stream: ODataStreamWrapper, streamPromise: Promise<{}>;
            if (isCollection) {
                stream = (<any>include).stream = new ODataStreamWrapper();
                streamPromise = (<any>include).streamPromise = stream.toPromise();
            }
            if (fn) {
                await this.__applyParams(ctrl, fn.call, params, include.ast, result, include);
                let fnCall = ctrl.prototype[fn.call];
                let fnResult = fnCaller.call(ctrl, fnCall, params);

                if (isIterator(fnCall)) {
                    fnResult = await run(fnResult, defaultHandlers);
                }

                if (isPromise(fnResult)) {
                    fnResult = await fnResult;
                }

                if (isCollection && (isStream(fnResult) || !fnResult || (stream && stream.buffer && stream.buffer.length > 0)) && stream && streamPromise) navigationResult = await ODataResult.Ok((await streamPromise) || []);
                else navigationResult = await ODataResult.Ok(fnResult);
                await this.__appendODataContext(navigationResult, navigationType, include.includes, select);
                ctrl = this.serverType.getController(navigationType);
            } else {
                ctrl = this.serverType.getController(navigationType);
                if (isCollection) {
                    let foreignKeys = Edm.getForeignKeys(elementType, include.navigationProperty);
                    let typeKeys = Edm.getKeyProperties(navigationType);
                    result.foreignKeys = {};
                    let part: any = {};
                    let foreignFilter = (await Promise.all(foreignKeys.map(async (key) => {
                        result.foreignKeys[key] = result[typeKeys[0]];
                        return `${key} eq ${await Edm.escape(result[typeKeys[0]], Edm.getTypeName(navigationType, key, this.serverType.container))}`;
                    }))).join(" and ");
                    if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                    navigationResult = await this.__read(ctrl, part, params, result, foreignFilter, navigationType, include, select);
                } else {
                    const foreignKeys = Edm.getForeignKeys(elementType, include.navigationProperty);
                    result.foreignKeys = {};
                    let part: any = {};
                    part.key = foreignKeys.map(key => {
                        result.foreignKeys[key] = result[key];
                        return {
                            name: key,
                            value: result[key]
                        };
                    });
                    if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                    navigationResult = await this.__read(ctrl, part, params, result, undefined, navigationType, include, select);
                }
            }
        }
        let entitySet = this.entitySets[this.resourcePath.navigation[0].name] == ctrl ? this.resourcePath.navigation[0].name : null;
        if (!entitySet) {
            for (let prop in this.entitySets) {
                if (this.entitySets[prop] == ctrl) {
                    entitySet = prop;
                    break;
                }
            }
        }
        delete navigationResult.body["@odata.context"];
        if (this.options.metadata == ODataMetadataType.full) {
            context[`${prop}@odata.associationLink`] = `${context["@odata.id"]}/${prop}/$ref`;
            context[`${prop}@odata.navigationLink`] = `${context["@odata.id"]}/${prop}`;
        }
        if (isCollection && navigationResult.body.value && Array.isArray(navigationResult.body.value)) {
            if (typeof navigationResult.body["@odata.count"] == "number") context[prop + "@odata.count"] = navigationResult.body["@odata.count"];
            context[prop] = navigationResult.body.value;
        } else if (navigationResult.body && Object.keys(navigationResult.body).length > 0) {
            context[prop] = navigationResult.body;
        }
        this.prevCtrl = oldPrevCtrl;
        this.ctrl = oldCtrl;
    }

    private __enableStreaming(part: NavigationPart) {
        this.streamEnabled = part == this.resourcePath.navigation[this.resourcePath.navigation.length - 1] ||
            (this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1] &&
                this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1].name == "$value");
        if (!this.streamEnabled) this.resultCount = 0;
    }

    private async __applyParams(container: any, name: string, params: any, queryString?: string | Token, result?: any, include?) {
        let queryParam, filterParam, contextParam, streamParam, resultParam, idParam, bodyParam;

        queryParam = odata.getQueryParameter(container, name);
        filterParam = odata.getFilterParameter(container, name);
        contextParam = odata.getContextParameter(container, name);
        streamParam = odata.getStreamParameter(container, name);
        resultParam = odata.getResultParameter(container, name);
        idParam = odata.getIdParameter(container, name);
        bodyParam = odata.getBodyParameter(container, name);
        let typeParam = odata.getTypeParameter(container, name);

        let elementType = (result && result.elementType) || (this.ctrl && this.ctrl.prototype.elementType) || null;
        if (queryParam) {
            let queryAst = queryString || this.resourcePath.ast.value.query || null;
            if (typeof queryAst == "string") {
                queryAst = this.serverType.parser.query(queryAst, { metadata: this.resourcePath.ast.metadata || this.serverType.$metadata().edmx });
                if (!include) queryAst = deepmerge(queryAst, this.resourcePath.ast.value.query || {});
                const lastNavigationPath = this.resourcePath.navigation[this.resourcePath.navigation.length - 1];
                const queryType = lastNavigationPath.type == "QualifiedEntityTypeName" ?
                    this.resourcePath.navigation[this.resourcePath.navigation.length - 1].node[ODATA_TYPE] :
                    (result || this.ctrl.prototype).elementType;
                await new ResourcePathVisitor(this.serverType, this.entitySets).Visit(<Token>queryAst, {}, queryType);
            }
            params[queryParam] = this.serverType.connector ? this.serverType.connector.createQuery(queryAst, elementType) : queryAst;

            if (container.prototype instanceof ODataControllerBase){
                const validator = (<typeof ODataControllerBase>container).validator;
                if (validator){
                    validator(params[queryParam]);
                }
            }
        }

        if (filterParam) {
            let filterAst = queryString;
            let resourceFilterAst = this.resourcePath.ast.value.query && this.resourcePath.ast.value.query.value.options && this.resourcePath.ast.value.query.value.options.find(t => t.type == TokenType.Filter);
            if (typeof filterAst == "string") {
                filterAst = qs.parse(filterAst).$filter;
                if (typeof filterAst == "string") {
                    filterAst = this.serverType.parser.filter(filterAst, { metadata: this.resourcePath.ast.metadata || this.serverType.$metadata().edmx });
                    const lastNavigationPath = this.resourcePath.navigation[this.resourcePath.navigation.length - 1];
                    const queryType = lastNavigationPath.type == "QualifiedEntityTypeName" ?
                        this.resourcePath.navigation[this.resourcePath.navigation.length - 1].node[ODATA_TYPE] :
                        (result || this.ctrl.prototype).elementType;
                    await new ResourcePathVisitor(this.serverType, this.entitySets).Visit(<Token>filterAst, {}, queryType);
                }
            } else {
                let token = <Token>queryString;
                filterAst = token && token.value && token.value.options && (<Token[]>token.value.options).find(t => t.type == TokenType.Filter);
            }
            if (filterAst && !include) {
                filterAst = deepmerge(filterAst, (resourceFilterAst || {}).value || {});
            }
            params[filterParam] = this.serverType.connector ? this.serverType.connector.createFilter(filterAst, elementType) : filterAst;

            if (container.prototype instanceof ODataControllerBase){
                const validator = (<typeof ODataControllerBase>container).validator;
                if (validator){
                    validator(params[filterParam]);
                }
            }
        }

        if (contextParam) {
            params[contextParam] = this.context;
        }

        if (streamParam) {
            params[streamParam] = include ? include.stream : this;
        }

        if (resultParam) {
            params[resultParam] = result instanceof ODataResult ? result.body : result;
        }

        if (idParam) {
            params[idParam] = decodeURI(this.resourcePath.id || this.body["@odata.id"]);
        }

        if (bodyParam && !params[bodyParam]) {
            params[bodyParam] = this.body;
        }

        if (typeParam) {
            params[typeParam] = params[typeParam] || elementType;
        }
    }

    async execute(body?: any): Promise<ODataResult> {
        this.body = body;
        let next = await this.workflow.shift().call(this, body);
        while (this.workflow.length > 0) {
            next = await this.workflow.shift().call(this, next);
        }
        return next;
    }
}