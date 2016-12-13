import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import { Edm as Metadata } from "odata-v4-metadata";
import * as extend from "extend";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { Transform, Readable, Duplex, TransformOptions } from "stream";
import { ODataResult, IODataResult } from "./result";
import { ODataController } from "./controller";
import * as odata from "./odata";
import { ResourceNotFoundError, MethodNotAllowedError } from "./error";
import { createMetadataJSON } from "./metadata";
import { ODataProcessor, ODataProcessorOptions } from "./processor";

/** ODataServer base class to be extended by concrete OData Server data sources */
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
                    response: res
                }, {
                    disableEntityConversion: true
                });
                processor.on("contentType", (contentType) => {
                    res.contentType(contentType);
                });
                let hasError = false;
                processor.on("data", (chunk, encoding, done) => {
                    if (!hasError){
                        res.write(chunk, encoding, done);
                    }
                });
                processor.execute(req.body || req).then((result:ODataResult) => {
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
                        hasError = true;
                        next(err);
                    }
                }, (err) => {
                    hasError = true;
                    next(err);
                });
            }catch(err){
                next(err);
            }
        };
    }

    static execute(url:string, method:string, body?:any):Promise<ODataResult>;
    static execute(context:any, body?:any):Promise<ODataResult>;
    static execute(url:string | any, method:string | any, body?:any):Promise<ODataResult>{
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
        }, <any>done);
    }

    _flush(done?:Function){
        if (typeof done == "function") done();
    }

    static createProcessor(context:any, options?:ODataProcessorOptions){
        return new ODataProcessor(context, this, options);
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
            if (this.prototype[i] &&
                this.prototype[i].prototype &&
                this.prototype[i].prototype instanceof ODataController &&
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

/** ?????????? */
/** Create Express middleware for OData error handling */
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

/** Create Express server for OData Server
 * @param server OData Server instance
 * @return       Express Router object
 */
export function createODataServer(server:typeof ODataServer):express.Router;
/** Create Express server for OData Server
 * @param server OData Server instance
 * @param port   port number for Express to listen to
 */
export function createODataServer(server:typeof ODataServer, port:number):void;
/** Create Express server for OData Server
 * @param server OData Server instance
 * @param path   routing path for Express
 * @param port   port number for Express to listen to
 */
export function createODataServer(server:typeof ODataServer, path:string, port:number):void;
/** Create Express server for OData Server
 * @param server   OData Server instance
 * @param port     port number for Express to listen to
 * @param hostname hostname for Express
 */
export function createODataServer(server:typeof ODataServer, port:number, hostname:string):void;
/** Create Express server for OData Server
 * @param server   OData Server instance
 * @param path     routing path for Express
 * @param port     port number for Express to listen to
 * @param hostname hostname for Express
 * @return         Express Router object
 */
export function createODataServer(server:typeof ODataServer, path?:string | RegExp | number, port?:number | string, hostname?:string):void | express.Router{
    return server.create(path, port, hostname);
}