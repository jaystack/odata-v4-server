import { createServiceOperationCall } from "odata-v4-resource";
import { Visitor as ResourceVisitor, ODataResource, NavigationPart } from "odata-v4-resource/lib/visitor";
import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import { TokenType } from "odata-v4-parser/lib/lexer";
import * as ODataParser from "odata-v4-parser";
import * as extend from "extend";
import { Promise } from "es6-promise";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as url from "url";
import * as qs from "qs";
import { getFunctionParameters } from "./utils";
import { ODataResult, IODataResult } from "./result";
import { ODataController } from "./controller";
import { Edm } from "./edm";
import { odata } from "./odata";
import { ResourceNotFoundError, MethodNotAllowedError } from "./error";
import { createMetadataJSON } from "./metadata";

const getODataContext = function(result, context, baseResource, resourcePath){
    return (context.protocol || "http") + "://" + (context.host || "localhost") + (context.base || "") + "/$metadata#" + (baseResource.name || "");
}

const extendODataContext = function(result, context, baseResource, resourcePath){
    if (baseResource.type == TokenType.EntityCollectionNavigationProperty){
        let context = "/" + baseResource.name;
        if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return context + "/$entity";
        if (baseResource.key){
            let type = result.elementType;
            let keys = Edm.getKeyProperties(type);
            context += "(" + keys.map(key => Edm.escape(result.body[key], Edm.getTypeName(type.constructor, key))).join(",") + ")";
        }
        return context;
    }
    if (baseResource.type == TokenType.EntityNavigationProperty){
        return "/" + baseResource.name;
    }
    if (baseResource.key && resourcePath.navigation.indexOf(baseResource) == resourcePath.navigation.length - 1) return "/$entity";
    if (baseResource.key){
        let type = result.elementType;
        let keys = Edm.getKeyProperties(type);
        return "(" + keys.map(key => Edm.escape(result.body[key], Edm.getTypeName(type.constructor, key))).join(",") + ")";
    }
    if (baseResource.type == TokenType.PrimitiveProperty) return "/" + baseResource.name;
    return "";
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

export class ODataProcessor{
    private serverType:typeof ODataServer
    private ctrl:typeof ODataController
    private resourcePath:ODataResource
    private workflow:any[]
    private context:any
    private method:string
    private url:any
    private entitySets:string[]

    constructor(context, server){
        this.context = context;
        this.serverType = server;

        let method = this.method = context.method.toLowerCase();
        if (ODataRequestMethods.indexOf(method) < 0) throw new MethodNotAllowedError();
        
        this.url = url.parse(context.url);
        let pathname = this.url.pathname;
        let resourcePath = this.resourcePath = createServiceOperationCall(pathname, this.serverType.$metadata().edmx);
        let entitySets = this.entitySets = odata.getPublicControllers(this.serverType);

        this.workflow = [];
        if (resourcePath.navigation.length > 0){
            this.workflow = resourcePath.navigation.map((part) => {
                let fn = this["__" + part.type];
                if (fn) return fn.call(this, part);
                console.log(`Unhandled navigation type: ${part.type}`);
            }).filter(it => !!it);
            if (resourcePath.call) this.workflow.push(this.__actionOrFunction(resourcePath.call, resourcePath.params));
        }else{
            if (resourcePath.call) this.workflow = [this.__actionOrFunctionImport(resourcePath.call, resourcePath.params)];
        }
    }

    __EntityCollectionNavigationProperty(part:NavigationPart):Function{
        return (result) => {
            return new Promise((resolve, reject) => {
                let resultType = result.elementType;
                let elementType = Edm.getType(resultType, part.name);
                let ctrl = this.serverType.getController(elementType);
                let foreignKeys = Edm.getForeignKeys(resultType, part.name);
                let typeKeys = Edm.getKeyProperties(resultType);
                let foreignFilter = foreignKeys.map((key) => {
                    return `${key} eq ${Edm.escape(result.body[typeKeys[0]], Edm.getTypeName(elementType, key))}`;
                }).join(" AND ");
                let params = {};
                if (part.key) part.key.forEach((key) => params[key.name] = key.value);
                this.__read(ctrl, part, params, null, foreignFilter).then((foreignResult:any) => {
                    foreignResult.body["@odata.context"] = result.body["@odata.context"] + extendODataContext(foreignResult, this.context, part, this.resourcePath);
                    resolve(foreignResult);
                }, reject);
            });
        };
    }

    __EntityNavigationProperty(part:NavigationPart):Function{
        return (result) => {
            return new Promise((resolve, reject) => {
                let resultType = result.elementType;
                let elementType = Edm.getType(resultType, part.name);
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
                this.__read(ctrl, part, params).then((foreignResult:any) => {
                    foreignResult.body["@odata.context"] = result.body["@odata.context"] + extendODataContext(foreignResult, this.context, part, this.resourcePath);
                    resolve(foreignResult);
                }, reject);
            });
        };
    }

    __PrimitiveProperty(part:NavigationPart):Function{
        return (result) => {
            return new Promise((resolve, reject) => {
                result.body["@odata.context"] += extendODataContext(result, this.context, part, this.resourcePath);
                result.body = {
                    "@odata.context": result.body["@odata.context"],
                    value: result.body[part.name]
                };
                resolve(result);
            });
        };
    }

    __read(ctrl:typeof ODataController, part:any, params:any, data?:any, filter?:string){
        return new Promise((resolve, reject) => {
            this.ctrl = ctrl;
            let fn:any = odata.findODataMethod(ctrl, this.method, part.key);
            if (!fn) return reject(new ResourceNotFoundError());

            let queryParam, filterParam, contextParam;
            if (typeof fn != "function"){
                let fnDesc = fn;
                queryParam = odata.getQueryParameter(ctrl, fnDesc.call);
                filterParam = odata.getFilterParameter(ctrl, fnDesc.call);
                contextParam = odata.getContextParameter(ctrl, fnDesc.call);
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
            }else{
                queryParam = odata.getQueryParameter(ctrl, this.method);
                filterParam = odata.getFilterParameter(ctrl, this.method);
                contextParam = odata.getContextParameter(ctrl, this.method);
            }

            let queryString = filter ? `$filter=${filter}` : this.url.query;
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

            if (!(currentResult instanceof Promise)){
                currentResult = new Promise((resolve) => {
                    resolve(currentResult);
                });
            }

            currentResult.then((result:any):any => {
                if (!(result instanceof ODataResult)){
                    return (<Promise<ODataResult>>ODataRequestResult[this.method](result)).then((result) => {
                        if (typeof result.body == "object" && result.body){
                            if (!result.body["@odata.context"]) result.body = extend({ "@odata.context": getODataContext(result.body, this.context, part, this.resourcePath) }, result.body);
                            result.body["@odata.context"] += extendODataContext(result, this.context, part, this.resourcePath);
                        }
                        return result;
                    }, reject);
                }

                if (typeof result.body == "object" && result.body){
                    if (!result.body["@odata.context"]) result.body = extend({ "@odata.context": getODataContext(result.body, this.context, part, this.resourcePath) }, result.body);
                    result.body["@odata.context"] += extendODataContext(result, this.context, part, this.resourcePath);
                }

                return result;
            }).then(resolve, reject);
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

    __actionOrFunctionImport(call:string, params:any):Function{
        let fn = this.serverType.prototype[call];
        return (data) => {
            return new Promise((resolve, reject) => {
                try{
                    let result = fnCaller.call(data, fn, params);
                    if (Edm.isActionImport(this.serverType, call)){
                        return ODataResult.NoContent(result).then(resolve, reject);
                    }else if (Edm.isFunctionImport(this.serverType, call)){
                        return ODataResult.Ok(result).then((result) => {
                            if (typeof result.body == "object" && result.body){
                                if (!result.body["@odata.context"]) result.body["@odata.context"] = getODataContext(result.body, this.context, {
                                    name: Edm.getReturnType(this.serverType, call)
                                }, this.resourcePath);
                            }
                            resolve(result);
                        }, reject);
                    }
                }catch(err){
                    reject(err);
                }
            });
        };
    }

    __actionOrFunction(call:string, params:any):Function{
        return (result) => {
            return new Promise((resolve, reject) => {
                let boundOpName = call.split(".").pop();
                let boundOp = this.ctrl ? this.ctrl[boundOpName] || expCalls[boundOpName] : expCalls[boundOpName];
                try{
                    let opResult = fnCaller.call(boundOpName in expCalls ? result : this.ctrl, boundOp, params);
                    return ODataResult.Ok(opResult).then((result) => {
                        if (typeof result.body == "object" && result.body){
                            if (!result.body["@odata.context"]) result.body["@odata.context"] = getODataContext(result.body, this.context, {
                                name: Edm.getReturnType(this.ctrl, boundOpName)
                            }, this.resourcePath);
                        }
                        resolve(result);
                    }, reject);
                }catch(err){
                    reject(err);
                }
            });
        };
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
                this.createProcessor({
                    url: req.url,
                    method: req.method,
                    protocol: req.secure ? "https" : "http",
                    host: req.headers.host,
                    base: req.baseUrl,
                    request: req,
                    response: res
                }).execute(req.body).then((result:ODataResult) => {
                    res.status(result.statusCode);
                    res.setHeader("OData-Version", "4.0");
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
export function createODataServer(server:typeof ODataServer, path?:string | RegExp | number, port?:number | string, hostname?:string):express.Router{
    let router = express.Router();
    router.use(bodyParser.json());
    if ((<any>server).cors) router.use(cors());
    router.get('/', server.document().requestHandler());
    router.get('/\\$metadata', server.$metadata().requestHandler());
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