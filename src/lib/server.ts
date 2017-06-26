import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import { Edm as Metadata } from "odata-v4-metadata";
import * as extend from "extend";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { Transform, TransformOptions } from "stream";
import { ODataResult } from "./result";
import { ODataController } from "./controller";
import * as odata from "./odata";
import { ODataBase } from "./odata";
import { createMetadataJSON } from "./metadata";
import { ODataProcessor, ODataProcessorOptions, ODataMetadataType } from "./processor";
import { HttpRequestError, UnsupportedMediaTypeError } from "./error";
import { ContainerBase } from "./edm";

/** HTTP context interface when using the server HTTP request handler */
export interface ODataHttpContext{
    url:string
    method:string
    protocol:"http"|"https"
    host:string
    base:string
    request:express.Request
    response:express.Response
}

function ensureODataMetadataType(req, res){
    let metadata:ODataMetadataType = ODataMetadataType.minimal;
    if (req.headers && req.headers.accept && req.headers.accept.indexOf("odata.metadata=") >= 0){
        if (req.headers.accept.indexOf("odata.metadata=full") >= 0) metadata = ODataMetadataType.full;
        else if (req.headers.accept.indexOf("odata.metadata=none") >= 0) metadata = ODataMetadataType.none;
    }

    res["metadata"] = metadata;
}
function ensureODataContentType(req, res, contentType?){
    contentType = contentType || "application/json";
    if (contentType.indexOf("odata.metadata=") < 0) contentType += `;odata.metadata=${ODataMetadataType[res["metadata"]]}`;
    if (contentType.indexOf("odata.streaming=") < 0) contentType += ";odata.streaming=true";
    if (contentType.indexOf("IEEE754Compatible=") < 0) contentType += ";IEEE754Compatible=false";
    if (req.headers.accept && req.headers.accept.indexOf("charset") > 0){
        contentType += `;charset=${res["charset"]}`;
    }
    res.contentType(contentType);
}
function ensureODataHeaders(req, res, next?){
    res.setHeader("OData-Version", "4.0");

    ensureODataMetadataType(req, res);
    let charset = req.headers["accept-charset"] || "utf-8";
    res["charset"] = charset;
    ensureODataContentType(req, res);

    if ((req.headers.accept && req.headers.accept.indexOf("charset") < 0) || req.headers["accept-charset"]){
        const bufferEncoding = {
            "utf-8": "utf8",
            "utf-16": "utf16le"
        };
        let origsend = res.send;
        res.send = <any>((data) => {
            if (typeof data == "object") data = JSON.stringify(data);
            origsend.call(res, new Buffer(data, bufferEncoding[charset]));
        });
    }

    if (typeof next == "function") next();
}

/** ODataServer base class to be extended by concrete OData Server data sources */
export class ODataServerBase extends Transform{
    private static _metadataCache:any
    static namespace:string
    static container = new ContainerBase();
    private serverType:typeof ODataServer

    static requestHandler(){
        return (req, res, next) => {
            try{
                ensureODataHeaders(req, res);
                let processor = this.createProcessor({
                    url: req.url,
                    method: req.method,
                    protocol: req.secure ? "https" : "http",
                    host: req.headers.host,
                    base: req.baseUrl,
                    request: req,
                    response: res
                }, <ODataProcessorOptions>{
                    metadata: res["metadata"]
                });
                processor.on("header", (headers) => {
                    for (let prop in headers){
                        if (prop.toLowerCase() == "content-type"){
                            ensureODataContentType(req, res, headers[prop]);
                        }else{
                            res.setHeader(prop, headers[prop]);
                        }
                    }
                });
                let hasError = false;
                processor.on("data", (chunk, encoding, done) => {
                    if (!hasError){
                        res.write(chunk, encoding, done);
                    }
                });
                let body = req.body && Object.keys(req.body).length > 0 ? req.body : req;
                processor.execute(body).then((result:ODataResult) => {
                    try{
                        if (result){
                            res.status(result.statusCode || 200);
                            if (!res.headersSent){
                                ensureODataContentType(req, res, result.contentType || "text/plain");
                            }
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
        let processor = this.createProcessor(context, <ODataProcessorOptions>{
            metadata: context.metadata || ODataMetadataType.minimal
        });
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

    _transform(chunk:any, _?:string, done?:Function){
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
        router.use((req, _, next) => {
            req.url = req.url.replace(/[\/]+/g, "/").replace(":/", "://");
            if (req.headers["odata-maxversion"] && req.headers["odata-maxversion"] < "4.0") return next(new HttpRequestError(500, "Only OData version 4.0 supported"));
            next();
        });
        router.use(bodyParser.json());
        if ((<any>server).cors) router.use(cors());
        router.use((req, res, next) => {
            res.setHeader("OData-Version", "4.0");
            if (req.headers.accept &&
                req.headers.accept.indexOf("application/json") < 0 &&
                req.headers.accept.indexOf("text/html") < 0 &&
                req.headers.accept.indexOf("*/*") < 0 &&
                req.headers.accept.indexOf("xml") < 0){
                next(new UnsupportedMediaTypeError());
            }else next();
        });
        router.get("/", ensureODataHeaders, (req, _, next) => {
            if (typeof req.query == "object" && Object.keys(req.query).length > 0) return next(new HttpRequestError(500, "Unsupported query"));
            next();
        }, server.document().requestHandler());
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
export class ODataServer extends ODataBase<ODataServerBase, typeof ODataServerBase>(ODataServerBase){}

/** ?????????? */
/** Create Express middleware for OData error handling */
export function ODataErrorHandler(err, _, res, next){
    if (err){
        if (res.headersSent) {
            return next(err);
        }
        let statusCode = err.statusCode || err.status || (res.statusCode < 400 ? 500 : res.statusCode);
        if (!res.statusCode || res.statusCode < 400) res.status(statusCode);
        res.send({
            error: {
                code: statusCode,
                message: err.message,
                stack: err.stack
            }
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
