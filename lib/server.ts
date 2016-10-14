import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import { Edm as Metadata } from "odata-v4-metadata";
import * as ODataParser from "odata-v4-parser";
import * as extend from "extend";
export { Promise } from "es6-promise";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as url from "url";
import * as qs from "qs";
import { Transform, Readable, Duplex, TransformOptions } from "stream";
import * as JSONStream from "JSONStream";
import { getFunctionParameters } from "./utils";
import { ODataResult, IODataResult } from "./result";
import { ODataController } from "./controller";
import { ResourcePathVisitor, NavigationPart } from "./visitor";
import { Edm } from "./edm";
import { odata } from "./odata";
import { ResourceNotFoundError, MethodNotAllowedError } from "./error";
import { createMetadataJSON } from "./metadata";

const createODataContext = function(context, entitySets, server:typeof ODataServer, resourcePath){
    let odataContextBase = (context.protocol || "http") + "://" + (context.host || "localhost") + (context.base || "") + "/$metadata#";
    let odataContext = "";
    let prevResource = null;
    let prevType:any = server;
    resourcePath.navigation.forEach((baseResource) => {
        if (baseResource.type == TokenType.EntitySetName){
            prevResource = baseResource;
            prevType = baseResource.key ? entitySets[baseResource.name].prototype.elementType : entitySets[baseResource.name];
            odataContext += baseResource.name;
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
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets){
                        if (entitySets[prop] == ctrl){
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? "" : "/$entity") : returnTypeName;
                }
                return odataContext += returnTypeName;
            }else{
                let call = baseResource.name;
                let returnType = Edm.getReturnType(server, call);
                let returnTypeName = Edm.getReturnTypeName(server, call);
                if (typeof returnType == "function"){
                    let ctrl = server.getController(returnType);
                    let entitySet = null;
                    for (let prop in entitySets){
                        if (entitySets[prop] == ctrl){
                            entitySet = prop;
                            break;
                        }
                    }
                    returnType = entitySet ? entitySet + (returnTypeName.indexOf("Collection") == 0 ? "" : "/$entity") : returnTypeName;
                }
                return odataContext += returnTypeName;
            }
        }
        if (baseResource.type == TokenType.EntityCollectionNavigationProperty){
            prevResource = baseResource;
            odataContext += "/" + baseResource.name;
            prevType = baseResource.key ? Edm.getType(prevType, baseResource.name) : server.getController(<Function>Edm.getType(prevType, baseResource.name));
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return odataContext += "/$entity";
            if (baseResource.key){
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
            return odataContext;
        }
        if (baseResource.type == TokenType.EntityNavigationProperty){
            prevResource = baseResource;
            prevType = Edm.getType(prevType, baseResource.name);
            return odataContext += "/" + baseResource.name;
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
    let paramsArray = Object.keys(params);
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
    put: ODataResult.NoContent,
    patch: ODataResult.NoContent,
    delete: ODataResult.NoContent
};

const expCalls = {
    $count: function(){
        return this.body && this.body.value ? (this.body.value.length || 0) : 0;
    },
    $value: function(){
        if (this.stream) return this.stream;

        let result = this.body.value || this.body;
        for (let prop in result){
            if (prop.indexOf("@odata") >= 0) delete result[prop];
        }

        return result.value || result;
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
            return "__actionOrFunction";
    }
};

const writeMethods = [
    "delete",
    "post",
    "put",
    "patch"
];

function isIterator(value){
    return value instanceof (function*() {}).constructor;
}

function isPromise(value){
    return value && typeof value.then == "function";
}

function isStream(stream){
    return stream !== null && typeof stream == "object" && typeof stream.pipe == "function";
}

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
}

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

export class ODataProcessor extends Transform{
    private serverType:typeof ODataServer
    private ctrl:typeof ODataController
    private instance:ODataController
    private resourcePath:ResourcePathVisitor
    private workflow:any[]
    private context:any
    private method:string
    private url:any
    private query:any
    private entitySets:string[]
    private odataContext:string
    private body:any
    private streamStart = false;
    private streamEnabled = false;
    private resultCount = 0;

    constructor(context, server){
        super(<TransformOptions>{
            objectMode: true
        });

        this.context = context;
        this.serverType = server;

        let method = this.method = context.method.toLowerCase();
        if (ODataRequestMethods.indexOf(method) < 0) throw new MethodNotAllowedError();
        
        this.url = url.parse(context.url);
        this.query = qs.parse(this.url.query);
        let ast = ODataParser.odataUri(context.url, { metadata: this.serverType.$metadata().edmx });
        let resourcePath = this.resourcePath = new ResourcePathVisitor().Visit(ast);
        let entitySets = this.entitySets = odata.getPublicControllers(this.serverType);
        this.odataContext = createODataContext(context, entitySets, server, resourcePath);

        this.workflow = resourcePath.navigation.map((part) => {
            let fn = this[getResourcePartFunction(part.type) || ("__" + part.type)];
            if (fn) return fn.call(this, part);
        }).filter(it => !!it);
    }

    _transform(chunk:any, encoding?:string, done?:Function){
        if (this.streamEnabled){
            if (!(chunk instanceof Buffer)){
                if (!this.streamStart){
                    this.push('{"@odata.context":"' + this.odataContext + '","value":[');
                }else this.push(',');
                try{
                    let entity = {};
                    this.__convertEntity(entity, chunk, this.ctrl.prototype.elementType);
                    chunk = JSON.stringify(entity);
                }catch(err){
                    try{
                        chunk = chunk.toString();
                    }catch(err){
                        super.end();
                    }
                }finally{
                    this.streamStart = true;
                    this.push(chunk);
                }
            }else this.push(chunk);
        }else{
            this.resultCount++;
            if (typeof done == "function") done();
        }
        if (typeof done == "function") done();
    }

    _flush(done?:Function){
        if (this.streamEnabled){
            if (this.streamStart) this.push("]}");
            else this.push('{"@odata.context":"' + this.odataContext + '","value":[]}');
        }
        if (typeof done == "function") done();
    }

    __EntityCollectionNavigationProperty(part:NavigationPart):Function{
        return (result) => {
            let resultType = result.elementType;
            let elementType = <Function>Edm.getType(resultType, part.name);
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
        };
    }

    __EntityNavigationProperty(part:NavigationPart):Function{
        return (result) => {
            let resultType = result.elementType;
            let elementType = <Function>Edm.getType(resultType, part.name);
            let ctrl = this.serverType.getController(elementType);
            let foreignKeys = Edm.getForeignKeys(resultType, part.name);
            let typeKeys = Edm.getKeyProperties(elementType);
            let params = {};
            result.foreignKeys = {};
            (<any>part).key = foreignKeys.map((key) => {
                result.foreignKeys[key] = result.body[key];
                return {
                    name: key,
                    value: result.body[key]
                };
            });
            if (part.key) part.key.forEach((key) => params[key.name] = key.value);
            return this.__read(ctrl, part, params, result);
        };
    }

    __PrimitiveProperty(part:NavigationPart):Function{
        return (result) => {
            return new Promise((resolve, reject) => {
                this.__enableStreaming(part);

                let value = result.body[part.name];
                if (isStream(value)){
                    value.pipe(this);
                    value.on("end", resolve);
                    value.on("error", reject);
                }else{
                    result.body = {
                        "@odata.context": result.body["@odata.context"],
                        value: value
                    };
                    if (typeof value == "object") result.elementType = Object.getPrototypeOf(value).constructor;
                    resolve(result);
                }
            });
        };
    }

    __PrimitiveCollectionProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    __ComplexProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    __ComplexCollectionProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    __read(ctrl:typeof ODataController, part:any, params:any, data?:any, filter?:string){
        return new Promise((resolve, reject) => {
            this.ctrl = ctrl;

            let method = writeMethods.indexOf(this.method) >= 0 && this.resourcePath.navigation.indexOf(part) < this.resourcePath.navigation.length - 1
                ? "get"
                : this.method;

            this.instance = new ctrl();
            let fn:any = odata.findODataMethod(ctrl, method, part.key);
            if (!fn) return reject(new ResourceNotFoundError());

            let queryString = filter ? `$filter=${filter}` : this.url.query;
            if (this.resourcePath.navigation.indexOf(part) == this.resourcePath.navigation.length - 1){
                queryString = Object.keys(this.query).map((p) => {
                    if (p == "$filter" && filter){
                        this.query[p] = `(${this.query[p]}) and (${filter})`;
                    }
                    return p + "=" + this.query[p];
                }).join("&") || queryString;
            }

            if (typeof fn != "function"){
                let fnDesc = fn;
                this.__applyParams(ctrl, fnDesc.call, params, queryString);
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
            }else this.__applyParams(ctrl, method, params, queryString);

            this.__enableStreaming(part);

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
                    let bodyParam = odata.getBodyParameter(ctrl, fn.name);
                    if (bodyParam) params[bodyParam] = data ? extend(this.body, data.foreignKeys) : this.body;
                    if (!part.key){
                        let properties:string[] = Edm.getProperties(ctrl.prototype.elementType.prototype);
                        properties.forEach((prop) => {
                            if (Edm.isKey(ctrl.prototype.elementType, prop)){
                                params[prop] = this.body[prop] || ((data || {}).body || {})[prop];
                            }
                        });
                    }
                    currentResult = fnCaller.call(ctrl, fn, params);
                    break;
            }

            if (isIterator(fn)){
                currentResult = run(currentResult, [
                    ODataGeneratorHandlers.PromiseHandler,
                    ODataGeneratorHandlers.StreamHandler
                ]);
            }

            if (!isPromise(currentResult)){
                currentResult = new Promise((resolve) => resolve(currentResult));
            }

            return currentResult.then((result:any):any => {
                if (isStream(result) && !Edm.isMediaEntity(this.ctrl.prototype.elementType)){
                    return new Promise((resolve, reject) => {
                        result.on("end", resolve);
                        result.on("error", reject);
                    });
                }
                if (!(result instanceof ODataResult)){
                    return (<Promise<ODataResult>>ODataRequestResult[method](result)).then((result) => {
                        if (typeof result.body != "undefined") this.__appendODataContext(result, this.ctrl.prototype.elementType);
                        resolve(result);
                    }, reject);
                }

                this.__appendODataContext(result, this.ctrl.prototype.elementType);
                resolve(result);
            });
        });
    }

    __EntitySetName(part:NavigationPart):Function{
        let ctrl = this.entitySets[part.name];
        let params = {};
        if (part.key) part.key.forEach((key) => params[key.name] = key.value);
        return (data) => {
            return this.__read(ctrl, part, params, data);
        };
    }

    __actionOrFunctionImport(part:NavigationPart):Function{
        let fn = this.serverType.prototype[part.name];
        return (data) => {
            return new Promise((resolve, reject) => {
                try{
                    this.__enableStreaming(part);

                    let returnType = <Function>Edm.getReturnType(this.serverType, part.name);
                    this.__applyParams(this.serverType, part.name, part.params);
                    let result = fnCaller.call(data, fn, part.params);
                    let schemas = this.serverType.$metadata().edmx.dataServices.schemas;
                    if (Edm.isActionImport(this.serverType, part.name) || 
                        schemas.some(schema => schema.entityContainer.some(container => container.actionImports.some(actionImport => actionImport.name == part.name)))
                    ){
                        return ODataResult.NoContent(result).then(resolve, reject);
                    }else if (Edm.isFunctionImport(this.serverType, part.name) ||
                        schemas.some(schema => schema.entityContainer.some(container => container.functionImports.some(functionImport => functionImport.name == part.name)))
                    ){
                        return ODataResult.Ok(result).then((result) => {
                            if (isStream(result.body)){
                                (<any>result.body).on("end", resolve);
                                (<any>result.body).on("error", reject);
                            }else{
                                this.__appendODataContext(result, returnType);
                                resolve(result);
                            }
                        }, reject);
                    }
                }catch(err){
                    reject(err);
                }
            });
        };
    }

    __actionOrFunction(part:NavigationPart):Function{
        return (result:ODataResult) => {
            return new Promise((resolve, reject) => {
                this.__enableStreaming(part);
                if (!result) return resolve();

                let boundOpName = part.name.split(".").pop();
                let elementType = result.elementType;
                let entityBoundOp = elementType.prototype[boundOpName];
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
                                    parameter.name == "bindingParameter" && parameter.type == ((<any>elementType).namespace + "." + elementType.name))))
                    ){
                        isAction = true;
                    }
                    this.__applyParams(elementType, boundOpName, part.params, null, result);
                }else if (ctrlBoundOp){
                    scope = this.instance;
                    returnType = <Function>Edm.getReturnType(this.ctrl, boundOpName);
                    if (Edm.isAction(elementType, boundOpName) ||
                        schemas.some(schema => 
                            schema.actions.some(action => 
                                action.name == boundOpName && action.isBound && action.parameters.some(parameter => 
                                    parameter.name == "bindingParameter" && parameter.type == "Collection(" + ((<any>elementType).namespace + "." + elementType.name) + ")")))
                    ){
                        isAction = true;
                    }
                    this.__applyParams(this.ctrl, boundOpName, part.params, null, result);
                }else if (expOp) scope = result;
                let boundOp = entityBoundOp || ctrlBoundOp || expOp;
                try{
                    let opResult = fnCaller.call(scope, boundOp, part.params);
                    if (boundOp == expOp){
                        let expResult = boundOpName == "$count" ? opResult || this.resultCount : opResult;
                        if (Edm.isMediaEntity(elementType)){
                            this.emit("contentType", Edm.getContentType(elementType));
                            opResult.pipe(this);
                            opResult.on("end", resolve);
                            opResult.on("error", reject);
                        }else{
                            return ODataResult.Ok(expResult, typeof expResult == "object" ? "application/json" : "text/plain").then((result) => {
                                if (typeof expResult == "object") result.elementType = elementType;
                                resolve(result);
                            });
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
                            this.__appendODataContext(result, returnType);
                            resolve(result);
                        }
                    }, reject);
                }catch(err){
                    reject(err);
                }
            });
        };
    }

    __appendODataContext(result:any, elementType:Function){
        let context:any = {
            "@odata.context": this.odataContext
        };
        if (typeof result.body == "object" && result.body){
            if (typeof result.body["@odata.count"] == "number") context["@odata.count"] = result.body["@odata.count"];

            if (typeof elementType == "function" && Edm.isMediaEntity(elementType)){
                context["@odata.mediaReadLink"] = (this.context.protocol || "http") + "://" + (this.context.host || "localhost") + (this.context.base || "") + this.context.url + "/$value";
                context["@odata.mediaContentType"] = Edm.getContentType(elementType);
                result.stream = result.body;
            }

            if (!result.body["@odata.context"]){
                if (Array.isArray(result.body.value)){
                    context.value = result.body.value;
                    result.body.value.forEach((entity, i) => {
                        if (typeof entity == "object"){
                            let item = {};
                            this.__convertEntity(item, entity, elementType);
                            context.value[i] = item;
                        }
                    });
                }else{
                    this.__convertEntity(context, result.body, elementType);
                }
            }
        }else if (typeof result.body != "undefined"){
            context.value = result.body;
        }
        result.body = context;
        result.elementType = elementType;
    }

    __convertEntity(context, result, elementType){
        if (elementType === Object || this.context.disableEntityConversion) return extend(context, result);
        let props = Edm.isOpenType(elementType) ? Object.getOwnPropertyNames(result) : Edm.getProperties(elementType.prototype);
        if (props.length > 0){
            props.forEach((prop) => {
                let type:any = Edm.getType(elementType, prop);
                let itemType;
                if (typeof type == "function"){
                    itemType = function(){};
                    itemType.prototype = Object.create(type);
                    itemType.prototype.constructor = type;
                }
                let converter:Function = Edm.getConverter(elementType, prop);
                let isCollection = Edm.isCollection(elementType, prop);
                let entity = result;
                if (isCollection && entity[prop]){
                    let value = Array.isArray(entity[prop]) ? entity[prop] : (typeof entity[prop] != "undefined" ? [entity[prop]] : []);
                    if (typeof type == "function"){
                        context[prop] = value.map((it) => {
                            if (!it) return it;
                            let item = new itemType();
                            this.__convertEntity(item, it, type);
                            return item;
                        });
                    }else if (typeof converter == "function") context[prop] = value.map(it => converter(it));
                    else context[prop] = value;
                }else{
                    if (typeof type == "function" && entity[prop]){
                        context[prop] = new itemType();
                        this.__convertEntity(context[prop], entity[prop], type);
                    }else if (typeof converter == "function") context[prop] = converter(entity[prop]);
                    else if (typeof entity[prop] != "undefined") context[prop] = entity[prop];
                }
            });
        }
    }

    __enableStreaming(part:NavigationPart){
        this.streamEnabled = part == this.resourcePath.navigation[this.resourcePath.navigation.length - 1] ||
            (this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1] &&
                this.resourcePath.navigation[this.resourcePath.navigation.indexOf(part) + 1].name == "$value");
        if (!this.streamEnabled) this.resultCount = 0;
    }

    __applyParams(container:any, name:string, params:any, queryString?:string, result?:any){
        let queryParam, filterParam, contextParam, streamParam, resultParam;

        queryParam = odata.getQueryParameter(container, name);
        filterParam = odata.getFilterParameter(container, name);
        contextParam = odata.getContextParameter(container, name);
        streamParam = odata.getStreamParameter(container, name);
        resultParam = odata.getResultParameter(container, name);

        queryString = queryString || this.url.query;
        let queryAst = queryString ? ODataParser.query(queryString, { metadata: this.serverType.$metadata().edmx }) : null;
        if (queryParam){
            params[queryParam] = queryAst;
        }

        if (filterParam){
            let filter = queryString ? qs.parse(queryString).$filter : null;
            let filterAst = filter ? ODataParser.filter(filter, { metadata: this.serverType.$metadata().edmx }) : null;
            params[filterParam] = filterAst;
        }

        if (contextParam){
            params[contextParam] = this.context;
        }

        if (streamParam){
            params[streamParam] = this;
        }

        if (resultParam){
            params[resultParam] = result;
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

export class ODataServer extends Transform{
    private static _metadataCache:any
    static namespace:string
    static containerName:string
    private serverType:typeof ODataServer

    static requestHandler(){
        return (req, res, next) => {
            try{
                res.setHeader("OData-Version", "4.0");
                res.contentType("application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
                let processor = this.createProcessor({
                    url: req.url,
                    method: req.method,
                    protocol: req.secure ? "https" : "http",
                    host: req.headers.host,
                    base: req.baseUrl,
                    request: req,
                    response: res,
                    disableEntityConversion: true
                });
                processor.on("contentType", (contentType) => {
                    res.contentType(contentType);
                });
                processor.on("data", (chunk, encoding, done) => {
                    res.write(chunk, encoding, done);
                });
                processor.execute(req.body).then((result:ODataResult) => {
                    try{
                        if (result){
                            res.status(result.statusCode || 200);
                            if (!res.headersSent) res.contentType((result.contentType || "text/plain") + ";odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
                            if (typeof result.body != "undefined"){
                                if (typeof result.body != "object") res.send("" + result.body);
                                else res.send(result.body);
                            }
                        }
                        res.end();
                    }catch(err){
                        next(err);
                    }
                }, next);
            }catch(err){
                next(err);
            }
        };
    }

    static async execute(url:string, method:string, body?:any);
    static async execute(context:any, body?:any);
    static async execute(url:string | any, method:string | any, body?:any){
        let context:any = {};
        if (typeof url == "object"){
            context = extend(context, url);
            if (typeof method == "object"){
                body = method;
            }
            url = undefined;
            method = undefined;
        }else if (typeof url == "string" && typeof method == "string"){
            context.url = url;
            context.method = method;
        }
        let processor = this.createProcessor(context);
        let response = "";
        processor.on("data", (chunk) => response += chunk.toString());
        return processor.execute(context.body || body).then((result:ODataResult) => {
            if (response) result.body = JSON.parse(response);
            return result;
        });
    }

    constructor(opts?:TransformOptions){
        super(extend(<TransformOptions>{
            objectMode: true
        }, opts));
        this.serverType = Object.getPrototypeOf(this).constructor;
    }

    _transform(chunk:any, encoding?:string, done?:Function){
        if ((chunk instanceof Buffer) || typeof chunk == "string"){
            try{
                chunk = JSON.parse(chunk.toString());
            }catch(err){
                return done(err);
            }
        }
        this.serverType.execute(chunk).then((result) => {
            this.push(result);
            if (typeof done == "function") done();
        }, done);
    }

    _flush(done?:Function){
        if (typeof done == "function") done();
    }

    static createProcessor(context:any){
        return new ODataProcessor(context, this);
    }

    static $metadata():ServiceMetadata;
    static $metadata(metadata:Metadata.Edmx | any);
    static $metadata(metadata?):ServiceMetadata{
        if (metadata){
            if (!(metadata instanceof Metadata.Edmx)){
                if (metadata.version && metadata.dataServices && Array.isArray(metadata.dataServices.schema)) this._metadataCache = ServiceMetadata.processMetadataJson(metadata);
                else this._metadataCache = ServiceMetadata.defineEntities(metadata);
            }
        }
        return this._metadataCache || (this._metadataCache = ServiceMetadata.processMetadataJson(createMetadataJSON(this)));
    }

    static document():ServiceDocument{
        return ServiceDocument.processEdmx(this.$metadata().edmx);
    }

    static addController(controller:typeof ODataController, isPublic?:boolean);
    static addController(controller:typeof ODataController, isPublic?:boolean, elementType?:Function);
    static addController(controller:typeof ODataController, entitySetName?:string, elementType?:Function);
    static addController(controller:typeof ODataController, entitySetName?:string | boolean, elementType?:Function){
        odata.controller(controller, <string>entitySetName, elementType)(this);
    }
    static getController(elementType:Function){
        for (let i in this.prototype){
            if (this.prototype[i].prototype instanceof ODataController &&
                this.prototype[i].prototype.elementType == elementType){
                    return this.prototype[i];
                }
        }
        return null;
    }

    static create():express.Router;
    static create(port:number):void;
    static create(path:string, port:number):void;
    static create(port:number, hostname:string):void;
    static create(path?:string | RegExp | number, port?:number | string, hostname?:string):void;
    static create(path?:string | RegExp | number, port?:number | string, hostname?:string):void | express.Router{
        let server = this;
        let router = express.Router();
        router.use(bodyParser.json());
        if ((<any>server).cors) router.use(cors());
        router.get("/", server.document().requestHandler());
        router.get("/\\$metadata", server.$metadata().requestHandler());
        router.use(server.requestHandler());
        router.use(ODataErrorHandler);

        if (typeof path == "number"){
            if (typeof port == "string"){
                hostname = "" + port;
            }
            port = parseInt(<any>path, 10);
            path = undefined;
        }
        if (typeof port == "number"){
            let app = express();
            app.use((<any>path) || "/", router);
            app.listen(port, <any>hostname);
        }
        return router;
    }
}

export function ODataErrorHandler(err, req, res, next){
    if (err){
        console.log(err);
        res.status(err.statusCode || 500);
        res.send({
            error: err.message,
            stack: err.stack
        });
    }else next();
}

export function createODataServer(server:typeof ODataServer):express.Router;
export function createODataServer(server:typeof ODataServer, port:number):void;
export function createODataServer(server:typeof ODataServer, path:string, port:number):void;
export function createODataServer(server:typeof ODataServer, port:number, hostname:string):void;
export function createODataServer(server:typeof ODataServer, path?:string | RegExp | number, port?:number | string, hostname?:string):void | express.Router{
    return server.create(path, port, hostname);
}