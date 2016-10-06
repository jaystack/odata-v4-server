import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import * as ODataParser from "odata-v4-parser";
import * as extend from "extend";
import { Promise } from "es6-promise";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as url from "url";
import * as qs from "qs";
import { Transform, Readable, Duplex } from "stream";
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
    resourcePath.navigation.forEach((baseResource) => {
        if (baseResource.type == TokenType.EntitySetName){
            prevResource = baseResource;
            odataContext += baseResource.name;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return odataContext += "/$entity";
            if (baseResource.key){
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
        }else if (getResourcePartFunction(baseResource.type)){
            odataContext = "";
            if (prevResource){
                let target = entitySets[prevResource.name];
                if (!target) return;
                let propertyKey = baseResource.name.split(".").pop();
                let returnType = Edm.getReturnType(target, propertyKey);
                if (typeof returnType == "function"){
                    let returnTypeName = Edm.getReturnTypeName(target, propertyKey);
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
                return odataContext += returnType;
            }else{
                let call = baseResource.name;
                let returnType = Edm.getReturnType(server, call);
                if (typeof returnType == "function"){
                    let returnTypeName = Edm.getReturnTypeName(server, call);
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
                return odataContext += returnType;
            }
        }
        if (baseResource.type == TokenType.EntityCollectionNavigationProperty){
            prevResource = baseResource;
            odataContext += "/" + baseResource.name;
            if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return odataContext += "/$entity";
            if (baseResource.key){
                return odataContext += "(" + baseResource.key.map((key) => key.raw).join(",") + ")";
            }
            return odataContext;
        }
        if (baseResource.type == TokenType.EntityNavigationProperty){
            prevResource = baseResource;
            return odataContext += "/" + baseResource.name;
        }
        if (baseResource.type == TokenType.PrimitiveProperty ||
            baseResource.type == TokenType.PrimitiveCollectionProperty) return odataContext += "/" + baseResource.name;
    });
    return odataContextBase + odataContext;
}

const fnCaller = function(fn, body, params){
    if (!params && body){
        params = body;
        body = undefined;
    }
    params = params || {};
    let fnParams:any[];
    let paramsArray = Object.keys(params);
    fnParams = getFunctionParameters(fn);
    for (var i = 0; i < fnParams.length; i++){
        fnParams[i] = params[fnParams[i]];
    }

    fnParams = fnParams.concat(paramsArray.map((key) => <any>{ name: key, value: params[key] }));
    fnParams = fnParams.filter((it) => typeof it != "undefined");
    if (body){
        fnParams.unshift(body);
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
        return this.body.value.length;
    },
    $value: function(){
        return this.body.value || this.body;
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
            return "__actionOrFunctionImport";
        case "BoundPrimitiveFunctionCall":
        case "BoundPrimitiveCollectionFunctionCall":
        case "BoundComplexFunctionCall":
        case "BoundComplexCollectionFunctionCall":
        case "BoundEntityFunctionCall":
        case "BoundEntityCollectionFunctionCall":
            return "__actionOrFunction";
    }
};

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
    private streamStart = false;

    constructor(context, server){
        super();

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
            console.log(`Unhandled navigation type: ${part.type}`);
        }).filter(it => !!it);
    }

    write(chunk:any, done?:Function):boolean;
    write(chunk:any, encoding?:string, done?:Function);
    write(chunk:any, encoding?:string | Function, done?:Function):boolean{
        if (typeof encoding == "function"){
            done = encoding;
            encoding = undefined;
        }
        if (!(chunk instanceof Buffer)){
            if (!this.streamStart){
                super.write('{"@odata.context":"' + this.odataContext + '","value":[');
            }else super.write(',');
            try{
                chunk = JSON.stringify(chunk);
            }catch(err){
                try{
                    chunk = chunk.toString();
                }catch(err){
                    super.end();
                }
            }
            finally{
                this.streamStart = true;
                return super.write(chunk, done);
            }
        }else return super.write(chunk, done);
    }

    _transform(chunk:any, encoding?:string, done?:Function){
        this.push(chunk);
        if (typeof done == "function") done();
    }

    _flush(done?:Function){
        if (this.streamStart) super.write("]}");
        else super.write('{"@odata.context":"' + this.odataContext + '","value":[]}');
        if (typeof done == "function") done();
    }

    __EntityCollectionNavigationProperty(part:NavigationPart):Function{
        return (result) => {
            let resultType = result.elementType;
            let elementType = <Function>Edm.getType(resultType, part.name);
            let ctrl = this.serverType.getController(elementType);
            let foreignKeys = Edm.getForeignKeys(resultType, part.name);
            let typeKeys = Edm.getKeyProperties(resultType);
            let foreignFilter = foreignKeys.map((key) => {
                return `${key} eq ${Edm.escape(result.body[typeKeys[0]], Edm.getTypeName(elementType, key))}`;
            }).join(" and ");
            let params = {};
            if (part.key) part.key.forEach((key) => params[key.name] = key.value);
            return this.__read(ctrl, part, params, null, foreignFilter);
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
            (<any>part).key = foreignKeys.map((key) => {
                return {
                    name: key,
                    value: result.body[key]
                };
            });
            if (part.key) part.key.forEach((key) => params[key.name] = key.value);
            return this.__read(ctrl, part, params);
        };
    }

    __PrimitiveProperty(part:NavigationPart):Function{
        return (result) => {
            return new Promise((resolve, reject) => {
                result.body = {
                    "@odata.context": result.body["@odata.context"],
                    value: result.body[part.name]
                };
                resolve(result);
            });
        };
    }

    __PrimitiveCollectionProperty(part:NavigationPart):Function{
        return this.__PrimitiveProperty(part);
    }

    __read(ctrl:typeof ODataController, part:any, params:any, data?:any, filter?:string){
        return new Promise((resolve, reject) => {
            this.ctrl = ctrl;
            this.instance = new ctrl();
            let fn:any = odata.findODataMethod(ctrl, this.method, part.key);
            if (!fn) return reject(new ResourceNotFoundError());

            let queryString = filter ? `$filter=${filter}` : this.url.query;
            if (this.resourcePath.navigation.indexOf(part) == this.resourcePath.navigation.length - 1){
                queryString = Object.keys(this.query).map((p) => {
                    if (p == "$filter" && filter){
                        this.query[p] = `(${this.query[p]}) and (${filter})`;
                    }
                    return p + "=" + this.query[p];
                }).join("&");
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
            }else this.__applyParams(ctrl, this.method, params, queryString);

            let currentResult:any;
            switch (this.method){
                case "get":
                case "delete":
                    currentResult = fnCaller.call(ctrl, fn, params);
                    break;
                case "post":
                case "put":
                case "patch":
                    let bodyParam = odata.getBodyParameter(ctrl, fn.name);
                    if (bodyParam) params[bodyParam] = data;
                    if (!part.key){
                        let properties:string[] = Edm.getProperties(ctrl.prototype.elementType.prototype);
                        properties.forEach((prop) => {
                            if (Edm.isKey(ctrl.prototype.elementType, prop)){
                                params[prop] = data[prop];
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
                if (isStream(result)){
                    return new Promise((resolve, reject) => {
                        result.on("end", resolve);
                        result.on("error", reject);
                    });
                }
                if (!(result instanceof ODataResult)){
                    return (<Promise<ODataResult>>ODataRequestResult[this.method](result)).then((result) => {
                        if (typeof result.body == "object" && result.body){
                            if (!result.body["@odata.context"]) result.body = extend({ "@odata.context": this.odataContext }, result.body);
                        }
                        result.elementType = this.ctrl.prototype.elementType;
                        resolve(result);
                    }, reject);
                }

                if (typeof result.body == "object" && result.body){
                    if (!result.body["@odata.context"]) result.body = extend({ "@odata.context": this.odataContext }, result.body);
                }
                result.elementType = this.ctrl.prototype.elementType;
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
                    let returnType = <Function>Edm.getReturnType(this.serverType, part.name);
                    this.__applyParams(this.serverType, part.name, part.params);
                    let result = fnCaller.call(data, fn, part.params);
                    if (Edm.isActionImport(this.serverType, part.name)){
                        return ODataResult.NoContent(result).then(resolve, reject);
                    }else if (Edm.isFunctionImport(this.serverType, part.name)){
                        return ODataResult.Ok(result).then((result) => {
                            if (isStream(result.body)){
                                (<any>result.body).on("end", resolve);
                                (<any>result.body).on("error", reject);
                            }else{
                                if (typeof result.body == "object" && result.body){
                                    if (!result.body["@odata.context"]) result.body = extend({ "@odata.context": this.odataContext }, result.body);
                                }
                                result.elementType = returnType;
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
                let boundOpName = part.name.split(".").pop();
                let elementType = result.elementType;
                let entityBoundOp = elementType.prototype[boundOpName];
                let ctrlBoundOp = this.instance[boundOpName];
                let expOp = expCalls[boundOpName];
                let scope:any= this.serverType;
                let returnType:any = Object;
                if (entityBoundOp){
                    scope = result.body;
                    returnType = <Function>Edm.getReturnType(elementType, boundOpName);
                    this.__applyParams(elementType, boundOpName, part.params);
                }else if (ctrlBoundOp){
                    scope = this.instance;
                    returnType = <Function>Edm.getReturnType(this.ctrl, boundOpName);
                    this.__applyParams(this.ctrl, boundOpName, part.params);
                }else if (expOp) scope = result;
                let boundOp = entityBoundOp || ctrlBoundOp || expOp;
                try{
                    let opResult = fnCaller.call(scope, boundOp, part.params);
                    return ODataResult.Ok(opResult).then((result) => {
                        if (isStream(result.body)){
                            (<any>result.body).on("end", resolve);
                            (<any>result.body).on("error", reject);
                        }else{
                            if (typeof result.body == "object" && result.body){
                                if (!result.body["@odata.context"]) result.body = extend({ "@odata.context": this.odataContext }, result.body);
                            }
                            if (boundOpName in expCalls){
                                result.body = result.body.value;
                            }else result.elementType = returnType;
                            resolve(result);
                        }
                    }, reject);
                }catch(err){
                    reject(err);
                }
            });
        };
    }

    __applyParams(container:any, name:string, params:any, queryString?:string){
        let queryParam, filterParam, contextParam, streamParam;

        queryParam = odata.getQueryParameter(container, name);
        filterParam = odata.getFilterParameter(container, name);
        contextParam = odata.getContextParameter(container, name);
        streamParam = odata.getStreamParameter(container, name);

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
    }

    execute(body?:any):Promise<ODataResult>{
        this.workflow[0] = this.workflow[0].call(this, body);
        for (let i = 1; i < this.workflow.length; i++){
            this.workflow[0] = this.workflow[0].then((...args) => {
                return this.workflow[i].apply(this, args);
            });
        }
        return this.workflow[0];
    }
}

export class ODataServer{
    private static _metadataCache:any
    static namespace:string
    static containerName:string

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
                    response: res
                });
                processor.pipe(res);
                processor.execute(req.body).then((result:ODataResult) => {
                    res.status(result.statusCode);
                    res.send(typeof result.body == "object" ? result.body : "" + result.body);
                }, next);
            }catch(err){
                next(err);
            }
        };
    }

    static createProcessor(context:any){
        return new ODataProcessor(context, this);
    }

    static $metadata():ServiceMetadata{
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