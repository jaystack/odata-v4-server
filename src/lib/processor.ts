import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import * as ODataParser from "odata-v4-parser";
import * as extend from "extend";
import * as url from "url";
import * as qs from "qs";
import * as util from "util";
import { Transform, TransformOptions, Readable } from "stream";
import { getFunctionParameters, isIterator, isPromise, isStream } from "./utils";
import { ODataResult } from "./result";
import { ODataController } from "./controller";
import { ResourcePathVisitor, NavigationPart } from "./visitor";
import * as Edm from "./edm";
import * as odata from "./odata";
import { ResourceNotFoundError, MethodNotAllowedError } from "./error";
import { ODataServer } from "./server";

const getODataRoot = function(context){
    return (context.protocol || "http") + "://" + (context.host || "localhost") + (context.base || "");
}

const createODataContext = function(context, entitySets, server:typeof ODataServer, resourcePath, processor){
    let odataContextBase = getODataRoot(context) + "/$metadata#";
    let odataContext = "";
    let prevResource = null;
    let prevType:any = server;
    let selectContext = "";
    if (processor.query && processor.query.$select){
        selectContext = `(${processor.query.$select})`;
    }
    resourcePath.navigation.forEach((baseResource, i) => {
        let next = resourcePath.navigation[i + 1];
        let selectContextPart = (i == resourcePath.navigation.length - 1) ? selectContext : ""; 
        if (next && next.type == TokenType.RefExpression) return;
        if (baseResource.type == TokenType.EntitySetName){
            prevResource = baseResource;
            prevType = baseResource.key ? entitySets[baseResource.name].prototype.elementType : entitySets[baseResource.name];
            odataContext += baseResource.name;
            odataContext += selectContextPart;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return odataContext += "/$entity";
            if (baseResource.key){
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
        }else if (getResourcePartFunction(baseResource.type) && !(baseResource.name in expCalls)){
            odataContext = "";
            if (prevResource){
                let target = prevType || entitySets[prevResource.name];
                if (!target) return;
                let propertyKey = baseResource.name.split(".").pop();
                let returnType = Edm.getReturnType(target, propertyKey);
                let returnTypeName = Edm.getReturnTypeName(target, propertyKey);
                if (typeof returnType == "function"){
                    prevType = returnType;
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets){
                        if (entitySets[prop] == ctrl){
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? selectContextPart : selectContextPart + "/$entity") : returnTypeName;
                }else returnType = returnTypeName;
                return odataContext += returnType;
            }else{
                let call = baseResource.name;
                let returnType = Edm.getReturnType(server, call);
                let returnTypeName = Edm.getReturnTypeName(server, call);
                if (typeof returnType == "function"){
                    prevType = returnType;
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets){
                        if (entitySets[prop] == ctrl){
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? selectContextPart : selectContextPart + "/$entity") : returnTypeName;
                }else returnType = returnTypeName;
                return odataContext += returnType;
            }
        }
        if (baseResource.type == TokenType.EntityCollectionNavigationProperty){
            prevResource = baseResource;
            odataContext += "/" + baseResource.name;
            prevType = baseResource.key ? Edm.getType(prevType, baseResource.name) : server.getController(<Function>Edm.getType(prevType, baseResource.name));
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
            if (baseResource.key){
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
            return odataContext;
        }
        if (baseResource.type == TokenType.EntityNavigationProperty){
            prevResource = baseResource;
            prevType = Edm.getType(prevType, baseResource.name);
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
            baseResource.type == TokenType.ComplexCollectionProperty){
                prevType = Edm.getType(prevType, baseResource.name);
                return odataContext += "/" + baseResource.name;
            }
    });
    return odataContextBase + odataContext;
}

const fnCaller = function(fn, params){
    params = params || {};
    let fnParams:any[];
    fnParams = getFunctionParameters(fn);
    for (var i = 0; i < fnParams.length; i++){
        fnParams[i] = params[fnParams[i]];
    }
    return fn.apply(this, fnParams);
};

const ODataRequestMethods:string[] = ["get", "post", "put", "patch", "delete"];
const ODataRequestResult:any = {
    get: ODataResult.Ok,
    post: ODataResult.Created,
    put: (result, contentType) => {
        return (result ? ODataResult.Created : ODataResult.NoContent)(result, contentType);
    },
    patch: ODataResult.NoContent,
    delete: ODataResult.NoContent
};

const expCalls = {
    $count: function(processor){
        return this.body && this.body.value ? (this.body.value.length || 0) : 0;
    },
    $value: function(processor){
        let prevPart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 2];

        let fn = odata.findODataMethod(processor.ctrl, `${processor.method}/$value`, prevPart.key || []);
        if (fn){
            let ctrl = processor.ctrl;
            let params = {};
            if (prevPart.key) prevPart.key.forEach((key) => params[key.name] = key.value);

            let fnDesc = fn;
            processor.__applyParams(ctrl, fnDesc.call, params, processor.url.query, this);

            fn = ctrl.prototype[fnDesc.call];
            if (fnDesc.key.length == 1 && prevPart.key.length == 1 && fnDesc.key[0].to != prevPart.key[0].name){
                params[fnDesc.key[0].to] = params[prevPart.key[0].name];
                delete params[prevPart.key[0].name];
            }else{
                for (let i = 0; i < fnDesc.key.length; i++){
                    if (fnDesc.key[i].to != fnDesc.key[i].from){
                        params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                        delete params[fnDesc.key[i].from];
                    }
                }
            }

            let currentResult = fnCaller.call(ctrl, fn, params);

            if (isIterator(fn)){
                currentResult = run(currentResult, defaultHandlers);
            }

            if (!isPromise(currentResult)){
                currentResult = Promise.resolve(currentResult);
            }

            if (prevPart.type == "PrimitiveProperty" || prevPart.type == "PrimitiveKeyProperty") return currentResult.then(value => value.toString());
            return currentResult;
        }else{
            if (this.stream) return Promise.resolve(this.stream);
            if (this.body){
                let result = this.body.value || this.body;
                for (let prop in result){
                    if (prop.indexOf("@odata") >= 0) delete result[prop];
                }

                result = result.value || result;
                if (typeof result == "object" && (prevPart.type == "PrimitiveProperty" || prevPart.type == "PrimitiveKeyProperty")) return Promise.resolve(result.toString());
                return Promise.resolve(result);
            }
        }
    },
    $ref: function(processor){
        let prevPart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 2];
        let routePart = processor.resourcePath.navigation[processor.resourcePath.navigation.length - 3];

        let fn = odata.findODataMethod(processor.prevCtrl, processor.method + "/" + prevPart.name + "/$ref", routePart.key || []);
        if (processor.method == "get"){
            return {
                "@odata.context": `${getODataRoot(processor.context)}/$metadata#$ref`,
                "@odata.id": `${this.body["@odata.id"]}/${prevPart.name}`
            };
        }
        if (!fn) throw new ResourceNotFoundError();

        let linkUrl = (processor.resourcePath.id || (processor.body || {})["@odata.id"] || "").replace(getODataRoot(processor.context), "");
        let linkAst, linkPath, linkPart;
        if (linkUrl){
            linkUrl = decodeURIComponent(linkUrl);
            processor.emit("header", { "OData-EntityId": linkUrl });
            linkAst = ODataParser.odataUri(linkUrl, { metadata: processor.serverType.$metadata().edmx });
            linkPath = new ResourcePathVisitor().Visit(linkAst);
            linkPart = linkPath.navigation[linkPath.navigation.length - 1];
        }else linkPart = prevPart;

        let ctrl = processor.prevCtrl;
        let params = {};
        if (routePart.key) routePart.key.forEach((key) => params[key.name] = key.value);

        let fnDesc = fn;
        processor.__applyParams(ctrl, fnDesc.call, params, processor.url.query, this);

        fn = ctrl.prototype[fnDesc.call];
        if (fnDesc.key.length == 1 && routePart.key.length == 1 && fnDesc.key[0].to != routePart.key[0].name){
            params[fnDesc.key[0].to] = params[routePart.key[0].name];
            delete params[routePart.key[0].name];
        }else{
            for (let i = 0; i < fnDesc.key.length; i++){
                if (fnDesc.key[i].to != fnDesc.key[i].from){
                    params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                    delete params[fnDesc.key[i].from];
                }
            }
        }

        let linkParams = {};
        if (linkPart.key) linkPart.key.forEach((key) => linkParams[key.name] = key.value);

        if (fnDesc.link.length == 1 && linkPart.key.length == 1 && fnDesc.link[0].to != linkPart.key[0].name){
            params[fnDesc.link[0].to] = linkParams[linkPart.key[0].name];
        }else{
            for (let i = 0; i < fnDesc.link.length; i++){
                params[fnDesc.link[i].to] = linkParams[fnDesc.link[i].from];
            }
        }

        let currentResult = fnCaller.call(ctrl, fn, params);

        if (isIterator(fn)){
            currentResult = run(currentResult, defaultHandlers);
        }

        if (!isPromise(currentResult)){
            currentResult = Promise.resolve(currentResult);
        }

        return currentResult;
    }
};

const getResourcePartFunction = (type) => {
    switch (type){
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

export type GeneratorAction = (value?) => {};

export namespace ODataGeneratorHandlers{
    export function PromiseHandler(request:any, next:GeneratorAction){
        if (isPromise(request)){
            return request.then(next);
        }
    }

    export function StreamHandler(request:any, next:GeneratorAction){
        if (isStream(request)){
            return new Promise((resolve, reject) => {
                request.on("end", resolve);
                request.on("error", reject);
            }).then(next);
        }
    }

    export function GeneratorHandler(request:any, next:GeneratorAction){
        if (isIterator(request)){
            return run(request(), defaultHandlers).then(next);
        }
    }
}
const defaultHandlers = [
    ODataGeneratorHandlers.GeneratorHandler,
    ODataGeneratorHandlers.PromiseHandler,
    ODataGeneratorHandlers.StreamHandler
];

function run(iterator, handlers){
    function id(x){ return x; }
    function iterate(value?){
        let next = iterator.next(value);
        let request = next.value;
        let nextAction = next.done ? id : iterate;

        for (let handler of handlers){
            let action = handler(request, nextAction);
            if (typeof action != "undefined") return action;
        }
        return nextAction(request);
    }
    return iterate();
}

class ODataStreamWrapper extends Transform{
    buffer:any[];

    constructor(){
        super(<TransformOptions>{
            objectMode: true
        });
        this.buffer = [];
    }

    protected _transform(chunk:any, encoding:string, done:Function){
        this.buffer.push(chunk);
        if (typeof done == "function") done();
    }

    protected _flush(done?:Function){
        if (typeof done == "function") done();
    }

    toPromise(){
        return new Promise((resolve, reject) => {
            this.on("finish", () => {
                resolve(this.buffer);
            });
            this.on("error", reject);
        });
    }
}

class StreamWrapper{
    stream:any
    constructor(value){
        this.stream = value;
    }

    toJSON(){
        return undefined;
    }
}

export enum ODataMetadataType{
    minimal,
    full,
    none
}

export interface ODataProcessorOptions{
    disableEntityConversion:boolean
    metadata:ODataMetadataType
}

export class ODataProcessor extends Transform{
    private serverType:typeof ODataServer
    private options:ODataProcessorOptions
    private ctrl:typeof ODataController
    private prevCtrl:typeof ODataController
    private instance:ODataController
    private resourcePath:ResourcePathVisitor
    private workflow:any[]
    private context:any
    private method:string
    private url:any
    private query:any
    private entitySets:{
        [entitySet:string]: typeof ODataController
    }
    private odataContext:string
    private body:any
    private streamStart = false;
    private streamEnabled = false;
    private streamEnd = false;
    private streamInlineCount:number;
    private elementType:any;
    private resultCount = 0;

    constructor(context, server, options?:ODataProcessorOptions){
        super(<TransformOptions>{
            objectMode: true
        });

        this.context = context;
        this.serverType = server;
        this.options = options || <ODataProcessorOptions>{};

        let method = this.method = context.method.toLowerCase();
        if (ODataRequestMethods.indexOf(method) < 0) throw new MethodNotAllowedError();
        
        this.url = url.parse(context.url);
        this.query = qs.parse(this.url.query);
        let ast = ODataParser.odataUri(context.url, { metadata: this.serverType.$metadata().edmx });
        let resourcePath = this.resourcePath = new ResourcePathVisitor().Visit(ast);
        let entitySets = this.entitySets = odata.getPublicControllers(this.serverType);
        this.odataContext = createODataContext(context, entitySets, server, resourcePath, this);

        if (resourcePath.navigation.length == 0) throw new ResourceNotFoundError();
        this.workflow = resourcePath.navigation.map((part, i) => {
            let next = resourcePath.navigation[i + 1];
            if (next && next.type == TokenType.RefExpression) return;
            let fn = this[getResourcePartFunction(part.type) || ("__" + part.type)];
            if (fn) return fn.call(this, part);
        }).filter(it => !!it);

        this.workflow.push((result) => {
            return new Promise((resolve, reject) => {
                if (result && result.statusCode && result.statusCode == 201){
                    this.emit("header", {
                        "Location": result.body["@odata.id"]
                    });
                }
                resolve(result);
            });
        });
    }

    protected _transform(chunk:any, encoding:string, done:Function){
        if (this.streamEnabled){
            if (!(chunk instanceof Buffer)){
                if (!this.streamStart){
                    this.push("{");
                    if (this.options.metadata != ODataMetadataType.none){
                        this.push(`"@odata.context":"${this.odataContext}",`);
                    }
                    this.push('"value":[');
                }else this.push(',');
                try{
                    this.streamStart = true;
                    if (chunk instanceof Object){
                        if (chunk["@odata.count"] || chunk.inlinecount){
                            this.streamInlineCount = chunk["@odata.count"] || chunk.inlinecount;
                        }
                        let entity = {};
                        if (this.ctrl) this.__appendLinks(this.ctrl, this.ctrl.prototype.elementType, entity, chunk);
                        this.__convertEntity(entity, chunk, this.elementType || this.ctrl.prototype.elementType, this.resourcePath.includes).then(() => {
                            chunk = JSON.stringify(entity);
                            this.push(chunk);
                            if (typeof done == "function") done();
                        }, (err) => {
                            console.log(err);
                            if (typeof done == "function") done(err);
                        });
                    }else{
                        this.push(JSON.stringify(chunk));
                        if (typeof done == "function") done();
                    }
                }catch(err){
                    console.log(err);
                    if (typeof done == "function") done(err);
                }
            }else{
                this.push(chunk);
                if (typeof done == "function") done();
            }
        }else{
            this.resultCount++;
            if (typeof done == "function") done();
        }
    }

    protected _flush(done?:Function){
        if (this.streamEnabled){
            if (this.streamStart){
                if (typeof this.streamInlineCount == "number"){
                    this.push(`],"@odata.count":${this.streamInlineCount}}`);
                }else this.push("]}");
            }else{
                if (this.options.metadata != ODataMetadataType.none){
                    this.push('{"value":[]}');
                }else{
                    this.push(`{"@odata.context":"${this.odataContext}","value":[]}`);
                }
            }
        }
        this.streamEnd = true;
        if (typeof done == "function") done();
    }

    private __EntityCollectionNavigationProperty(part:NavigationPart):Function{
        return (result) => {
            let resultType = result.elementType;
            let elementType = <Function>Edm.getType(resultType, part.name);
            let partIndex = this.resourcePath.navigation.indexOf(part);
            let method = writeMethods.indexOf(this.method) >= 0 && partIndex < this.resourcePath.navigation.length - 1
                ? "get"
                : this.method;
            let fn:any = odata.findODataMethod(this.ctrl, `${method}/${part.name}`, part.key);
            if (fn){
                let ctrl = this.ctrl;
                let fnDesc = fn;
                let params = {};
                if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                this.__applyParams(ctrl, fnDesc.call, params, this.url.query, result);
                fn = ctrl.prototype[fnDesc.call];
                if (fnDesc.key.length == 1 && part.key.length == 1 && fnDesc.key[0].to != part.key[0].name){
                    params[fnDesc.key[0].to] = params[part.key[0].name];
                    delete params[part.key[0].name];
                }else{
                    for (let i = 0; i < fnDesc.key.length; i++){
                        if (fnDesc.key[i].to != fnDesc.key[i].from){
                            params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                            delete params[fnDesc.key[i].from];
                        }
                    }
                }
                if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                return this.__read(ctrl, part, params, result, fn, elementType).then((result) => {
                    this.ctrl = this.serverType.getController(elementType);
                    return result;
                });
            }else{
                let ctrl = this.serverType.getController(elementType);
                let foreignKeys = Edm.getForeignKeys(resultType, part.name);
                let typeKeys = Edm.getKeyProperties(resultType);
                result.foreignKeys = {};
                let foreignFilter = foreignKeys.map((key) => {
                    result.foreignKeys[key] = result.body[typeKeys[0]];
                    return `${key} eq ${Edm.escape(result.body[typeKeys[0]], Edm.getTypeName(elementType, key))}`;
                }).join(" and ");
                let params = {};
                if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                return this.__read(ctrl, part, params, result, foreignFilter);
            }
        };
    }

    private __EntityNavigationProperty(part:NavigationPart):Function{
        return (result) => {
            let resultType = result.elementType;
            let elementType = <Function>Edm.getType(resultType, part.name);
            let partIndex = this.resourcePath.navigation.indexOf(part);
            let method = writeMethods.indexOf(this.method) >= 0 && partIndex < this.resourcePath.navigation.length - 1
                ? "get"
                : this.method;
            let fn:any = odata.findODataMethod(this.ctrl, `${method}/${part.name}`, part.key);
            if (fn){
                let ctrl = this.ctrl;
                let fnDesc = fn;
                let params = {};
                if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                this.__applyParams(ctrl, fnDesc.call, params, this.url.query, result);
                fn = ctrl.prototype[fnDesc.call];
                if (fnDesc.key.length == 1 && part.key.length == 1 && fnDesc.key[0].to != part.key[0].name){
                    params[fnDesc.key[0].to] = params[part.key[0].name];
                    delete params[part.key[0].name];
                }else{
                    for (let i = 0; i < fnDesc.key.length; i++){
                        if (fnDesc.key[i].to != fnDesc.key[i].from){
                            params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                            delete params[fnDesc.key[i].from];
                        }
                    }
                }
                return this.__read(ctrl, part, params, result, fn, elementType).then((result) => {
                    this.ctrl = this.serverType.getController(elementType);
                    return result;
                });
            }else{
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
        };
    }

    private __PrimitiveProperty(part:NavigationPart):Function{
        return (result) => {
            return new Promise((resolve, reject) => {
                this.__enableStreaming(part);

                let currentResult;
                let prevPart = this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) - 1];
                let fn = odata.findODataMethod(this.ctrl, `${this.method}/${part.name}`, prevPart.key || []) ||
                    odata.findODataMethod(this.ctrl, `${this.method}/${part.name}/$value`, prevPart.key || []);
                if (!fn && this.method != "get"){
                    fn = this.method == "delete"
                        ? odata.findODataMethod(this.ctrl, "patch", prevPart.key || [])
                        : odata.findODataMethod(this.ctrl, `${this.method}`, prevPart.key || []);
                    if (fn){
                        let body = this.body;
                        if (Edm.getTypeName(result.elementType, part.name) != "Edm.Stream") body = body.body || body;
                        this.body = {};
                        this.body[part.name] = this.method == "delete" ? null : body.value || body;
                    }
                }
                if (fn){
                    let ctrl = this.prevCtrl;
                    let params = {};
                    if (prevPart.key) prevPart.key.forEach((key) => params[key.name] = key.value);

                    let fnDesc = fn;
                    this.__applyParams(ctrl, fnDesc.call, params, this.url.query, this);

                    fn = ctrl.prototype[fnDesc.call];
                    if (fnDesc.key.length == 1 && prevPart.key.length == 1 && fnDesc.key[0].to != prevPart.key[0].name){
                        params[fnDesc.key[0].to] = params[prevPart.key[0].name];
                        delete params[prevPart.key[0].name];
                    }else{
                        for (let i = 0; i < fnDesc.key.length; i++){
                            if (fnDesc.key[i].to != fnDesc.key[i].from){
                                params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                                delete params[fnDesc.key[i].from];
                            }
                        }
                    }

                    this.elementType = Edm.getType(result.elementType, part.name) || Object;
                    if (typeof this.elementType == "string") this.elementType = Object;
                    currentResult = fnCaller.call(ctrl, fn, params);

                    if (isIterator(fn)){
                        currentResult = run(currentResult, defaultHandlers);
                    }

                    if (!isPromise(currentResult)){
                        currentResult = Promise.resolve(currentResult);
                    }
                }else{
                    let value = result.body[part.name];
                    if (value instanceof StreamWrapper){
                        value = value.stream;
                    }

                    currentResult = Promise.resolve(value);
                }

                if (this.method == "get"){
                    currentResult.then((value) => {
                        try{
                            result.body = {
                                "@odata.context": this.options.metadata != ODataMetadataType.none ? result.body["@odata.context"] : undefined,
                                value: value
                            };
                            let elementType = result.elementType;
                            if (value instanceof Object) result.elementType = Edm.getType(result.elementType, part.name) || Object;

                            if (value && (isStream(value) || isStream(value.stream))){
                                this.emit("header", { "Content-Type": Edm.getContentType(elementType.prototype, part.name) || value.contentType || "application/octet-stream" });
                                if (value.stream) value = value.stream;
                                value.pipe(this);
                                value.on("end", resolve);
                                value.on("error", reject);
                            }else{
                                if (this.streamEnabled && this.streamStart) delete result.body;
                                resolve(result);
                            }
                        }catch(err){
                            console.log(err);
                            reject(err);
                        }
                    }, reject);
                }else{
                    ODataResult.NoContent(currentResult).then(resolve, reject);
                }
            });
        };
    }

    private __PrimitiveKeyProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    private __PrimitiveCollectionProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    private __ComplexProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    private __ComplexCollectionProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    private __read(ctrl:typeof ODataController, part:any, params:any, data?:any, filter?:string | Function, elementType?:any, include?){
        return new Promise((resolve, reject) => {
            if (this.ctrl) this.prevCtrl = this.ctrl;
            else this.prevCtrl = ctrl;
            this.ctrl = ctrl;

            let method = writeMethods.indexOf(this.method) >= 0 &&
                this.resourcePath.navigation.indexOf(part) < this.resourcePath.navigation.length - 1
                ? "get"
                : this.method;

            this.instance = new ctrl();

            let fn;
            if (typeof filter == "string" || !filter){
                fn = odata.findODataMethod(ctrl, method, part.key);
                if (!fn) return reject(new ResourceNotFoundError());

                let queryString = filter ? `$filter=${filter}` : (include || this.url).query;
                if (include && filter && include.query && !include.query.$filter){
                    include.query.$filter = filter;
                    queryString = Object.keys(include.query).map(p => {
                        return `${p}=${include.query[p]}`;
                    }).join("&");
                }else if ((include && filter && include.query) || (!include && this.resourcePath.navigation.indexOf(part) == this.resourcePath.navigation.length - 1)){
                    queryString = Object.keys((include || this).query).map(p => {
                        if (p == "$filter" && filter){
                            (include || this).query[p] = `(${(include || this).query[p]}) and (${filter})`;
                        }
                        return `${p}=${(include || this).query[p]}`;
                    }).join("&") || queryString;
                }
                if (queryString && typeof queryString == "object"){
                    queryString = Object.keys(queryString).map(p => {
                        return `${p}=${queryString[p]}`;
                    }).join("&");
                }

                if (typeof fn != "function"){
                    let fnDesc = fn;
                    fn = ctrl.prototype[fnDesc.call];
                    if (fnDesc.key.length == 1 && part.key.length == 1 && fnDesc.key[0].to != part.key[0].name){
                        params[fnDesc.key[0].to] = params[part.key[0].name];
                        delete params[part.key[0].name];
                    }else{
                        for (let i = 0; i < fnDesc.key.length; i++){
                            if (fnDesc.key[i].to != fnDesc.key[i].from){
                                params[fnDesc.key[i].to] = params[fnDesc.key[i].from];
                                delete params[fnDesc.key[i].from];
                            }
                        }
                    }
                    this.__applyParams(ctrl, fnDesc.call, params, queryString, undefined, include);
                }else this.__applyParams(ctrl, method, params, queryString, undefined, include);
            }else fn = filter;

            if (!include) this.__enableStreaming(part);

            let currentResult:any;
            switch (method){
                case "get":
                case "delete":
                    currentResult = fnCaller.call(ctrl, fn, params);
                    break;
                case "post":
                    this.odataContext += "/$entity";
                case "put":
                case "patch":
                    let body = data ? extend(this.body, data.foreignKeys) : this.body;
                    let bodyParam = odata.getBodyParameter(ctrl, fn.name);
                    let typeParam = odata.getTypeParameter(ctrl, fn.name);
                    if (typeParam){
                        params[typeParam] = (body["@odata.type"] || (`${(<any>ctrl.prototype.elementType).namespace}.${(<any>ctrl.prototype.elementType).name}`)).replace(/^#/, "");
                    }
                    if (bodyParam){
                        this.__stripOData(body);
                        params[bodyParam] = body;
                    }
                    if (!part.key){
                        let properties:string[] = Edm.getProperties((elementType || ctrl.prototype.elementType).prototype);
                        properties.forEach((prop) => {
                            if (Edm.isKey(elementType || ctrl.prototype.elementType, prop)){
                                params[prop] = (this.body || {})[prop] || ((data || {}).body || {})[prop];
                            }
                        });
                    }
                    currentResult = fnCaller.call(ctrl, fn, params);
                    break;
            }

            if (isIterator(fn)){
                currentResult = run(currentResult, defaultHandlers);
            }

            if (!isPromise(currentResult)){
                currentResult = Promise.resolve(currentResult);
            }

            return currentResult.then((result:any):any => {
                if (isStream(result) && include){
                    include.streamPromise.then((result) => {
                        (<Promise<ODataResult>>ODataRequestResult[method](result)).then((result) => {
                            return this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType, (include || this.resourcePath).includes).then(() => {
                                resolve(result);
                            }, reject);
                        }, reject);
                    }, reject);
                }else if (isStream(result) && (!part.key || !Edm.isMediaEntity(elementType || this.ctrl.prototype.elementType))){
                    result.on("end", () => resolve(ODataRequestResult[method]()));
                    result.on("error", reject);
                }else if (!(result instanceof ODataResult)){
                    return (<Promise<ODataResult>>ODataRequestResult[method](result)).then((result) => {
                        if (!this.streamStart &&
                            writeMethods.indexOf(this.method) < 0 && !result.body) return reject(new ResourceNotFoundError());
                        try{
                            this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType, (include || this.resourcePath).includes).then(() => {
                                if (!this.streamEnd && this.streamEnabled && this.streamStart) this.on("end", () => resolve(result));
                                else resolve(result);
                            }, reject);
                        }catch(err){
                            reject(err);
                        }
                    }, reject);
                }else{
                    try{
                        this.__appendODataContext(result, elementType || this.ctrl.prototype.elementType, (include || this.resourcePath).includes).then(() => {
                            if (!this.streamEnd && this.streamEnabled && this.streamStart) this.on("end", () => resolve(result));
                            else resolve(result);
                        }, reject);
                    }catch(err){
                        reject(err);
                    }
                }
            }, reject);
        });
    }

    private __stripOData(obj){
        for (let prop in obj) {
            if (prop.indexOf("@odata") >= 0)
                delete obj[prop];
            if (typeof obj[prop] == "object") this.__stripOData(obj[prop]);
        }
    }

    private __EntitySetName(part:NavigationPart):Function{
        let ctrl = this.entitySets[part.name];
        let params = {};
        if (part.key) part.key.forEach((key) => params[key.name] = key.value);
        return (data) => {
            return this.__read(ctrl, part, params, data);
        };
    }

    private __actionOrFunctionImport(part:NavigationPart):Function{
        let fn = this.serverType.prototype[part.name];
        return (data) => {
            return new Promise((resolve, reject) => {
                try{
                    this.__enableStreaming(part);

                    let returnType = <Function>Edm.getReturnType(this.serverType, part.name);
                    let isAction = false;
                    let schemas = this.serverType.$metadata().edmx.dataServices.schemas;
                    if (Edm.isActionImport(this.serverType, part.name) || 
                        schemas.some(schema => schema.entityContainer.some(container => container.actionImports.some(actionImport => actionImport.name == part.name)))
                    ){
                        isAction = true;
                        part.params = extend(part.params, this.body);
                    }
                    this.__applyParams(this.serverType, part.name, part.params);
                    let result = fnCaller.call(data, fn, part.params);

                    if (isIterator(fn)){
                        result = run(result, defaultHandlers);
                    }

                    if (isAction){
                        return ODataResult.NoContent(result).then(resolve, reject);
                    }else{
                        return ODataResult.Ok(result).then((result) => {
                            if (isStream(result.body)){
                                (<any>result.body).on("end", resolve);
                                (<any>result.body).on("error", reject);
                            }else{
                                try{
                                    this.__appendODataContext(result, returnType, this.resourcePath.includes).then(() => {
                                        resolve(result);
                                    });
                                }catch(err){
                                    reject(err);
                                }
                            }
                        }, reject);
                    }
                }catch(err){
                    reject(err);
                }
            });
        };
    }

    private __actionOrFunction(part:NavigationPart):Function{
        return (result:ODataResult) => {
            return new Promise((resolve, reject) => {
                this.__enableStreaming(part);
                if (!result) return resolve();

                let boundOpName = part.name.split(".").pop();
                let elementType = result.elementType;
                let entityBoundOp = typeof elementType == "function" ? elementType.prototype[boundOpName] : null;
                let ctrlBoundOp = this.instance[boundOpName];
                let expOp = expCalls[boundOpName];
                let scope:any= this.serverType;
                let returnType:any = Object;
                let isAction = false;
                let schemas = this.serverType.$metadata().edmx.dataServices.schemas;
                if (entityBoundOp){
                    scope = result.body;
                    returnType = <Function>Edm.getReturnType(elementType, boundOpName);
                    if (Edm.isAction(elementType, boundOpName) ||
                        schemas.some(schema => 
                            schema.actions.some(action => 
                                action.name == boundOpName && action.isBound && action.parameters.some(parameter => 
                                    parameter.name == "bindingParameter" && parameter.type == ((<any>elementType).namespace + "." + (<any>elementType).name))))
                    ){
                        isAction = true;
                        part.params = extend(part.params, this.body);
                    }
                    this.__applyParams(elementType, boundOpName, part.params, null, result);
                }else if (ctrlBoundOp){
                    scope = this.instance;
                    returnType = <Function>Edm.getReturnType(this.ctrl, boundOpName);
                    if (Edm.isAction(elementType, boundOpName) ||
                        schemas.some(schema => 
                            schema.actions.some(action => 
                                action.name == boundOpName && action.isBound && action.parameters.some(parameter => 
                                    parameter.name == "bindingParameter" && parameter.type == "Collection(" + ((<any>elementType).namespace + "." + (<any>elementType).name) + ")")))
                    ){
                        isAction = true;
                        part.params = extend(part.params, this.body);
                    }
                    this.__applyParams(this.ctrl, boundOpName, part.params, null, result);
                }else if (expOp){
                    scope = result;
                    part.params["processor"] = this;
                }
                let boundOp = entityBoundOp || ctrlBoundOp || expOp;
                try{
                    let opResult = fnCaller.call(scope, boundOp, part.params);

                    if (isIterator(boundOp)){
                        opResult = run(opResult, defaultHandlers);
                    }

                    if (boundOp == expOp){
                        let expResult = Promise.resolve(boundOpName == "$count" ? opResult || this.resultCount : opResult);
                        if (elementType && boundOpName == "$value" && typeof elementType == "function" && Edm.isMediaEntity(elementType)){
                            opResult.then((opResult) => {
                                if (this.method == "get"){
                                    this.emit("header", { "Content-Type": Edm.getContentType(elementType) || opResult.contentType || "application/octet-stream" });
                                    if (opResult.stream) opResult = opResult.stream;
                                    opResult.pipe(this);
                                    opResult.on("end", resolve);
                                    opResult.on("error", reject);
                                }else ODataResult.NoContent().then(resolve, reject);
                            }, reject);
                        }else{
                            expResult.then((expResult) => {
                                return (<Promise<ODataResult>>(boundOpName == "$ref" && this.method != "get" ? ODataResult.NoContent : ODataRequestResult[this.method])(expResult, typeof expResult == "object" ? "application/json" : "text/plain")).then((result) => {
                                    if (typeof expResult == "object" && boundOpName != "$ref") result.elementType = elementType;
                                    resolve(result);
                                }, reject);
                            }, reject);
                        }
                    }
                    if (isAction){
                        return ODataResult.NoContent(opResult).then(resolve, reject);
                    }
                    return ODataResult.Ok(opResult).then((result) => {
                        if (isStream(result.body)){
                            (<any>result.body).on("end", resolve);
                            (<any>result.body).on("error", reject);
                        }else{
                            try{
                                this.__appendODataContext(result, returnType, this.resourcePath.includes).then(() => {
                                    resolve(result);
                                });
                            }catch(err){
                                reject(err);
                            }
                        }
                    }, reject);
                }catch(err){
                    reject(err);
                }
            });
        };
    }

    private __appendLinks(ctrl, elementType, context, body, result?){
        if (this.options.metadata == ODataMetadataType.none) return;
        let entitySet = this.entitySets[this.resourcePath.navigation[0].name] == ctrl ? this.resourcePath.navigation[0].name : null;
        if (!entitySet){
            for (let prop in this.entitySets){
                if (this.entitySets[prop] == ctrl){
                    entitySet = prop;
                    break;
                }
            }
        }
        if (entitySet){
            let resultType = Object.getPrototypeOf(body).constructor;
            if (resultType != Object && resultType != elementType) elementType = resultType;
            if (typeof body["@odata.type"] == "function") elementType = body["@odata.type"];
            let keys = Edm.getKeyProperties(elementType);
            let resolveBaseType = (elementType) => {
                let baseType = Object.getPrototypeOf(elementType.prototype).constructor;
                if (baseType != Object && Edm.getProperties(baseType.prototype).length > 0){
                    keys = Edm.getKeyProperties(baseType).concat(keys);
                    resolveBaseType(baseType);
                }
            };
            resolveBaseType(elementType);
            if (keys.length > 0){
                let id;
                try{
                    if (keys.length == 1){
                        id = Edm.escape(body[keys[0]], Edm.getTypeName(elementType, keys[0]));
                    }else{
                        id = keys.map(it => `${it}=${Edm.escape(body[it], Edm.getTypeName(elementType, it))}`).join(",");
                    }
                    if (typeof id != "undefined"){
                        context["@odata.id"] = `${getODataRoot(this.context)}/${entitySet}(${id})`;
                        if (typeof elementType == "function" && Edm.isMediaEntity(elementType)) {
                            context["@odata.mediaReadLink"] = `${getODataRoot(this.context)}/${entitySet}(${id})/$value`;
                            if (odata.findODataMethod(ctrl, "post/$value", [])){
                                context["@odata.mediaEditLink"] = `${getODataRoot(this.context)}/${entitySet}(${id})/$value`;
                            }
                            let contentType = Edm.getContentType(elementType);
                            if (contentType) context["@odata.mediaContentType"] = contentType;
                            if (typeof result == "object") result.stream = body;
                        }
                        if (odata.findODataMethod(ctrl, "put", keys) ||
                            odata.findODataMethod(ctrl, "patch", keys)){
                                context["@odata.editLink"] = `${getODataRoot(this.context)}/${entitySet}(${id})`;
                            }
                    }
                }catch(err){}
            }
        }
    }

    private async __appendODataContext(result:any, ctrlType:Function, includes?){
        if (typeof result.body == "undefined") return;
        let context:any = {
            "@odata.context": this.options.metadata != ODataMetadataType.none ? this.odataContext : undefined
        };
        let elementType = result.elementType = jsPrimitiveTypes.indexOf(result.elementType) >= 0 || result.elementType == String || typeof result.elementType != "function" ? ctrlType : result.elementType;
        if (typeof result.body == "object" && result.body){
            if (typeof result.body["@odata.count"] == "number") context["@odata.count"] = result.body["@odata.count"];
            if (!result.body["@odata.context"]){
                let ctrl = this.ctrl && this.ctrl.prototype.elementType == ctrlType ? this.ctrl : this.serverType.getController(ctrlType);
                if (result.body.value && Array.isArray(result.body.value)){
                    context.value = result.body.value;
                    await Promise.all(result.body.value.map((entity, i) => {
                        return (async (entity, i) => {
                            if (typeof entity == "object"){
                                let item = {};
                                if (ctrl) this.__appendLinks(ctrl, elementType, item, entity);
                                await this.__convertEntity(item, entity, elementType, includes);
                                context.value[i] = item;
                            }
                        })(entity, i);
                    }));
                }else{
                    if (ctrl) this.__appendLinks(ctrl, elementType, context, result.body, result);
                    await this.__convertEntity(context, result.body, elementType, includes);
                }
            }
        }else if (typeof result.body != "undefined" && result.body){
            context.value = result.body;
        }
        result.body = context;
    }

    private async __resolveAsync(type, prop, propValue, entity){
        if (isIterator(propValue)){
            propValue = await run(propValue.call(entity), defaultHandlers);
        }
        if (typeof propValue == "function") propValue = propValue.call(entity);
        if (isPromise(propValue)) propValue = await propValue;
        if (type != "Edm.Stream" && isStream(propValue)){
            let stream = new ODataStreamWrapper();
            (<Readable>propValue).pipe(stream);
            propValue = await stream.toPromise();
        }
        return propValue;
    }

    private async __convertEntity(context, result, elementType, includes?){
        if (elementType === Object || this.options.disableEntityConversion) return extend(context, result);
        let resultType = Object.getPrototypeOf(result).constructor;
        if (resultType != Object && resultType != this.ctrl.prototype.elementType){
            elementType = resultType;
            if (this.options.metadata != ODataMetadataType.none && Edm.isEntityType(elementType)) context["@odata.type"] = `#${(elementType.namespace || this.serverType.namespace)}.${elementType.name}`;
        }
        if (typeof result["@odata.type"] == "function"){
            elementType = result["@odata.type"];
            if (this.options.metadata != ODataMetadataType.none && Edm.isEntityType(elementType)) context["@odata.type"] = `#${(elementType.namespace || this.serverType.namespace)}.${elementType.name}`;
        }
        if (typeof context["@odata.type"] == "undefined" && this.ctrl && elementType != this.ctrl.prototype.elementType){
            if (this.options.metadata != ODataMetadataType.none && Edm.isEntityType(elementType)) context["@odata.type"] = `#${(elementType.namespace || this.serverType.namespace)}.${elementType.name}`;
        }
        if (this.options.metadata == ODataMetadataType.full){
            context["@odata.type"] = `#${(elementType.namespace || this.serverType.namespace)}.${elementType.name}`;
        }
        let props = Edm.getProperties(elementType.prototype);
        if (Edm.isOpenType(elementType)){
            props = Object.getOwnPropertyNames(result).concat(props);
        }
        let ctrl = this.serverType.getController(elementType);
        let resolveBaseType = (elementType) => {
            let baseType = Object.getPrototypeOf(elementType.prototype).constructor;
            if (baseType != Object && Edm.getProperties(baseType.prototype).length > 0){
                props = Edm.getProperties(baseType.prototype).concat(props);
                ctrl = ctrl || this.serverType.getController(baseType);
                resolveBaseType(baseType);
            }
        };
        resolveBaseType(elementType);
        let entityType = function(){};
        util.inherits(entityType, elementType);
        result = Object.assign(new entityType(), result);
        if (props.length > 0){
            let metadata = {};
            await Promise.all(props.map(prop => (async prop => {
                let type:any = Edm.getType(elementType, prop);
                let itemType;
                if (typeof type == "function"){
                    itemType = function(){};
                    util.inherits(itemType, type);
                }
                let converter:Function = Edm.getConverter(elementType, prop);
                let isCollection = Edm.isCollection(elementType, prop);
                let entity = result;
                let propValue = entity[prop];

                propValue = await this.__resolveAsync(type, prop, propValue, entity);

                if (isCollection && propValue){
                    let value = Array.isArray(propValue) ? propValue : (typeof propValue != "undefined" ? [propValue] : []);
                    for (let i = 0; i < value.length; i++){
                        value[i] = await this.__resolveAsync(type, prop, value[i], entity);
                    }
                    if (includes && includes[prop]){
                        await this.__include(includes[prop], context, prop, ctrl, entity, elementType);
                    }else if (typeof type == "function"){
                        for (let i = 0; i < value.length; i++){
                            let it = value[i];
                            if (!it) return it;
                            let item = new itemType();
                            await this.__convertEntity(item, it, type, includes);
                            value[i] = item;
                        }
                    }
                    if (typeof converter == "function"){
                        context[prop] = value.map(it => converter(it));
                    }else context[prop] = value;
                }else{
                    if (this.options.metadata == ODataMetadataType.full){
                        if (Edm.isEntityType(elementType, prop)){
                            if (!includes || (includes && !includes[prop])){
                                metadata[`${prop}@odata.associationLink`] = `${context["@odata.id"]}/${prop}/$ref`;
                                metadata[`${prop}@odata.navigationLink`] = `${context["@odata.id"]}/${prop}`;
                            }
                        }else if (type != "Edm.String" && type != "Edm.Boolean"){
                            let typeName = Edm.getTypeName(elementType, prop);
                            if (typeof type == "string" && type.indexOf("Edm.") == 0) typeName = typeName.replace(/Edm\./, "");
                            context[`${prop}@odata.type`] = `#${typeName}`;
                        }
                    }
                    if (includes && includes[prop]){
                        await this.__include(includes[prop], context, prop, ctrl, entity, elementType);
                    }else if (typeof type == "function" && propValue){
                        context[prop] = new itemType();
                        await this.__convertEntity(context[prop], propValue, type, includes);
                    }else if (typeof converter == "function"){
                        context[prop] = converter(propValue);
                    }else if (type == "Edm.Stream"){
                        if (this.options.metadata != ODataMetadataType.none){
                            context[`${prop}@odata.mediaReadLink`] = `${context["@odata.id"]}/${prop}`;
                            if (odata.findODataMethod(ctrl, `post/${prop}`, []) || odata.findODataMethod(ctrl, `post/${prop}/$value`, [])){
                                context[`${prop}@odata.mediaEditLink`] = `${context["@odata.id"]}/${prop}`;
                            }
                            let contentType = Edm.getContentType(elementType.prototype, prop) || (propValue && propValue.contentType);
                            if (contentType) context[`${prop}@odata.mediaContentType`] = contentType;
                        }
                        context[prop] = new StreamWrapper(propValue);
                    }else if (typeof propValue != "undefined") context[prop] = propValue;
                }
            })(prop)));
            Object.assign(context, metadata);
        }
    }

    private async __include(include:ResourcePathVisitor, context, prop, ctrl:typeof ODataController, result, elementType){
        try{
            let oldPrevCtrl = this.prevCtrl;
            let oldCtrl = this.ctrl;
            const isCollection = Edm.isCollection(elementType, include.navigationProperty);
            const navigationType = <Function>Edm.getType(elementType, include.navigationProperty);
            let navigationResult;
            if (typeof result[prop] == "object"){
                navigationResult = await ODataResult.Ok(result[prop]);
                await this.__appendODataContext(navigationResult, navigationType, include.includes);
                ctrl = this.serverType.getController(navigationType);
            }else{
                const fn = odata.findODataMethod(ctrl, `get/${include.navigationProperty}`, []);
                let params = {};
                let stream, streamPromise;
                if (isCollection){
                    stream = (<any>include).stream = new ODataStreamWrapper();
                    streamPromise = (<any>include).streamPromise = stream.toPromise();
                }
                if (fn){
                    this.__applyParams(ctrl, fn.call, params, include.ast, result, include);
                    let fnResult = await fnCaller.call(ctrl, ctrl.prototype[fn.call], params);
                    if (isStream(fnResult) && stream && streamPromise) navigationResult = await ODataResult.Ok(streamPromise);
                    else navigationResult = await ODataResult.Ok(fnResult);
                    await this.__appendODataContext(navigationResult, navigationType, include.includes);
                    ctrl = this.serverType.getController(navigationType);
                }else{
                    ctrl = this.serverType.getController(navigationType);
                    if (isCollection){
                        let foreignKeys = Edm.getForeignKeys(elementType, include.navigationProperty);
                        let typeKeys = Edm.getKeyProperties(navigationType);
                        result.foreignKeys = {};
                        let part:any = {};
                        let foreignFilter = foreignKeys.map((key) => {
                            result.foreignKeys[key] = result[typeKeys[0]];
                            return `${key} eq ${Edm.escape(result[typeKeys[0]], Edm.getTypeName(navigationType, key))}`;
                        }).join(" and ");
                        if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                        navigationResult = await this.__read(ctrl, part, params, result, foreignFilter, navigationType, include);
                    }else{
                        const foreignKeys = Edm.getForeignKeys(elementType, include.navigationProperty);
                        result.foreignKeys = {};
                        let part:any = {};
                        part.key = foreignKeys.map(key => {
                            result.foreignKeys[key] = result[key];
                            return {
                                name: key,
                                value: result[key]
                            };
                        });
                        if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                        navigationResult = await this.__read(ctrl, part, params, result, undefined, navigationType, include);
                    }
                }
            }
            let entitySet = this.entitySets[this.resourcePath.navigation[0].name] == ctrl ? this.resourcePath.navigation[0].name : null;
            if (!entitySet){
                for (let prop in this.entitySets){
                    if (this.entitySets[prop] == ctrl){
                        entitySet = prop;
                        break;
                    }
                }
            }
            delete navigationResult.body["@odata.context"];
            if (this.options.metadata == ODataMetadataType.full){
                context[`${prop}@odata.associationLink`] = `${context["@odata.id"]}/${prop}/$ref`;
                context[`${prop}@odata.navigationLink`] = `${context["@odata.id"]}/${prop}`;
            }
            if (isCollection && navigationResult.body.value && Array.isArray(navigationResult.body.value)){
                context[prop + "@odata.count"] = navigationResult.body["@odata.count"];
                context[prop] = navigationResult.body.value;
            }else if (navigationResult.body && Object.keys(navigationResult.body).length > 0){
                context[prop] = navigationResult.body;
            }
            this.prevCtrl = oldPrevCtrl;
            this.ctrl = oldCtrl;
        }catch(err){
            console.log(err);
        }
    }

    private __enableStreaming(part:NavigationPart){
        this.streamEnabled = part == this.resourcePath.navigation[this.resourcePath.navigation.length - 1] ||
            (this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1] &&
                this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1].name == "$value");
        if (!this.streamEnabled) this.resultCount = 0;
    }

    private __applyParams(container:any, name:string, params:any, queryString?:string | Token, result?:any, include?){
        let queryParam, filterParam, contextParam, streamParam, resultParam, idParam, bodyParam;

        queryParam = odata.getQueryParameter(container, name);
        filterParam = odata.getFilterParameter(container, name);
        contextParam = odata.getContextParameter(container, name);
        streamParam = odata.getStreamParameter(container, name);
        resultParam = odata.getResultParameter(container, name);
        idParam = odata.getIdParameter(container, name);
        bodyParam = odata.getBodyParameter(container, name);

        queryString = queryString || this.url.query;
        let queryAst = queryString ? (typeof queryString == "string" ? ODataParser.query(queryString, { metadata: this.serverType.$metadata().edmx }) : queryString) : null;
        if (queryParam){
            params[queryParam] = queryAst;
        }

        if (filterParam){
            let filter = queryString ? (typeof queryString == "string" ? qs.parse(queryString).$filter : (<Token[]>queryString.value.options).find(t => t.type == TokenType.Filter)) : null;
            let filterAst = filter ? (typeof filter == "string" ? ODataParser.filter(filter, { metadata: this.serverType.$metadata().edmx }) : filter) : null;
            params[filterParam] = filterAst;
        }

        if (contextParam){
            params[contextParam] = this.context;
        }

        if (streamParam){
            params[streamParam] = include ? include.stream : this;
        }

        if (resultParam){
            params[resultParam] = result instanceof ODataResult ? result.body : result;
        }

        if (idParam){
            params[idParam] = decodeURI(this.resourcePath.id || this.body["@odata.id"]);
        }

        if (bodyParam && !params[bodyParam]){
            params[bodyParam] = this.body;
        }
    }

    execute(body?:any):Promise<ODataResult>{
        this.body = body;
        this.workflow[0] = this.workflow[0].call(this, body);
        for (let i = 1; i < this.workflow.length; i++){
            this.workflow[0] = this.workflow[0].then((...args) => {
                return this.workflow[i].apply(this, args);
            });
        }
        return this.workflow[0];
    }
}