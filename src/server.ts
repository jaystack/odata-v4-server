import { createServiceOperationCall } from "odata-v4-resource";
import { Visitor as ResourceVisitor } from "odata-v4-resource/lib/visitor";
import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import * as extend from "extend";
import { Promise } from "es6-promise";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { getFunctionParameters } from "./utils";
import { ODataResult } from "./result";
import { ODataController } from "./controller";
import { Edm } from "./edm";
import { ResourceNotFoundError } from "./error";
import { createMetadataJSON } from "./metadata";

const annotateODataContext = function(result, req, baseResource){
    result["@odata.context"] = (req.secure ? "https" : "http") + "://" + req.headers.host + req.baseUrl + "/$metadata#" + baseResource.name + (baseResource.key ? "/$entity" : "");
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

const sortObject = function(o){
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
};

const ODataRequestMethods:string[] = ["get", "post", "put", "patch", "delete"];
const ODataRequestResult:any = {
    get: ODataResult.Ok,
    post: ODataResult.Created,
    put: ODataResult.NoContent,
    patch: ODataResult.NoContent,
    delete: ODataResult.NoContent
};

const $count = function(){
    return this.length;
};

export class ODataServer{
    private static _metadataCache:any
    static namespace:string
    static containerName:string
    configuration:any

    constructor(configuration?:any){
        this.configuration = extend(this.configuration || {}, configuration || {});
    }

    static requestHandler(configuration?:any){
        let server = new this(configuration);
        let serverType = this;
        let $metadata = this.$metadata();
        return function(req, res, next){
            let method = req.method.toLowerCase();
            if (ODataRequestMethods.indexOf(method) < 0) return next();
            
            let responseHandler = function(result:ODataResult, baseResource?:any, resourcePath?:any, instance?:any){
                if (resourcePath && instance && resourcePath.call){
                    let boundOpName = resourcePath.call.split(".").pop();
                    let boundOp = instance[boundOpName];
                    try{
                        if (!boundOp && boundOpName == "$count"){
                            boundOp = $count;
                        }
                        let opResult = fnCaller.call(result.body.value, boundOp, resourcePath.params);
                        ODataResult.Ok(opResult).then((result) => {
                            responseHandler(result, {
                                name: Edm.getReturnType(instance.constructor, boundOpName)
                            });
                        }, next);
                    }catch(err){
                        next(err);
                    }
                }else{
                    res.status(result.statusCode);
                    res.setHeader("OData-Version", "4.0");
                    console.log('------------------', result);
                    if (result.body){
                        if (typeof result.body == "object"){
                            annotateODataContext(result.body, req, baseResource);
                            res.send(sortObject(result.body));
                        }else res.send("" + result.body);
                    }else res.end();
                }
            };

            let resourcePath = createServiceOperationCall(req.url, $metadata.edmx);
            console.log(resourcePath);
            let navigationHandler = function(baseResource){
                //TODO: recursive navigation path
                if (!baseResource){
                    //Action or Function import handler
                    if (resourcePath.call){
                        let fn = server[resourcePath.call];
                        try{
                            let result = fnCaller.call(server, fn, resourcePath.params);
                            if (Edm.isActionImport(serverType, resourcePath.call)){
                                ODataResult.NoContent(result).then(responseHandler, next);
                            }else if (Edm.isFunctionImport(serverType, resourcePath.call)){
                                ODataResult.Ok(result).then((result) => {
                                    responseHandler(result, {
                                        name: Edm.getReturnType(serverType, resourcePath.call)
                                    });
                                }, next);
                            }
                        }catch(err){
                            next(err);
                        }
                    }else return next(new ResourceNotFoundError());
                }else{
                    let ctrl = server[baseResource.name];
                    let instance = new ctrl(req, res, next, server);
                    let params = {};
                    if (baseResource.key) baseResource.key.forEach((key) => params[key.name] = key.value);
                    let fn = instance[method];
                    if (!fn) return next(new ResourceNotFoundError());
                    let entity:any;
                    let result:any;
                    switch (method){
                        case "get":
                        case "delete":
                            result = fnCaller.call(instance, fn, params);
                            break;
                        case "post":
                        case "put":
                            let ctr:any = instance.elementType;
                            entity = new ctr(req.body);
                        case "patch":
                            if (!baseResource.key){
                                let properties:string[] = Edm.getProperties(instance.elementType.prototype);
                                properties.forEach((prop) => {
                                    if (Edm.isKey(instance.elementType, prop)){
                                        params[prop] = entity[prop];
                                    }
                                });
                            }
                            result = fnCaller.call(instance, fn, entity || req.body, params);
                            break;
                    }
                    if (result instanceof Promise){
                        let defer = <Promise<any>>result;
                        defer.then((result) => {
                            if (!(result instanceof ODataResult)){
                                return (<Promise<ODataResult>>ODataRequestResult[method](result)).then((result) => {
                                    return responseHandler(result, baseResource, resourcePath, instance);
                                }, next);
                            }
                            return responseHandler(result, baseResource, resourcePath, instance);
                        }, next);
                    }else{
                        if (!(result instanceof ODataResult)){
                            return (<Promise<ODataResult>>ODataRequestResult[method](result)).then((result) => {
                                return responseHandler(result, baseResource, resourcePath, instance);
                            }, next);
                        }
                        return responseHandler(result, baseResource, resourcePath, instance);
                    }
                }
            };
            navigationHandler(resourcePath.navigation.shift());
        };
    }

    static $metadata():ServiceMetadata{
        return this._metadataCache || (this._metadataCache = ServiceMetadata.processMetadataJson(createMetadataJSON(this)));
    }

    static document():ServiceDocument{
        return ServiceDocument.processEdmx(this.$metadata().edmx);
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
    router.use(server.requestHandler(server));
    router.use(ODataErrorHandler);

    if (typeof path == "number"){
        if (typeof port == "string"){
            hostname = "" + port;
        }
        port = parseInt(<string>path, 10);
        path = undefined;
    }
    if (typeof port == "number"){
        let app = express();
        app.use((<any>path) || "/", router);
        app.listen(port, <any>hostname);
    }
    return router;
}