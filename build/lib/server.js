"use strict";
const odata_v4_service_metadata_1 = require("odata-v4-service-metadata");
const odata_v4_service_document_1 = require("odata-v4-service-document");
const odata_v4_metadata_1 = require("odata-v4-metadata");
const extend = require("extend");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const stream_1 = require("stream");
const controller_1 = require("./controller");
const odata_1 = require("./odata");
const metadata_1 = require("./metadata");
const processor_1 = require("./processor");
class ODataServer extends stream_1.Transform {
    constructor(opts) {
        super(extend({
            objectMode: true
        }, opts));
        this.serverType = Object.getPrototypeOf(this).constructor;
    }
    static requestHandler() {
        return (req, res, next) => {
            try {
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
                    if (!hasError) {
                        res.write(chunk, encoding, done);
                    }
                });
                processor.execute(req.body || req).then((result) => {
                    try {
                        if (result) {
                            res.status(result.statusCode || 200);
                            if (!res.headersSent)
                                res.contentType((result.contentType || "text/plain") + ";odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
                            if (typeof result.body != "undefined") {
                                if (typeof result.body != "object")
                                    res.send("" + result.body);
                                else
                                    res.send(result.body);
                            }
                        }
                        res.end();
                    }
                    catch (err) {
                        hasError = true;
                        next(err);
                    }
                }, (err) => {
                    hasError = true;
                    next(err);
                });
            }
            catch (err) {
                next(err);
            }
        };
    }
    static execute(url, method, body) {
        let context = {};
        if (typeof url == "object") {
            context = extend(context, url);
            if (typeof method == "object") {
                body = method;
            }
            url = undefined;
            method = undefined;
        }
        else if (typeof url == "string" && typeof method == "string") {
            context.url = url;
            context.method = method;
        }
        let processor = this.createProcessor(context);
        let response = "";
        processor.on("data", (chunk) => response += chunk.toString());
        return processor.execute(context.body || body).then((result) => {
            if (response)
                result.body = JSON.parse(response);
            return result;
        });
    }
    _transform(chunk, encoding, done) {
        if ((chunk instanceof Buffer) || typeof chunk == "string") {
            try {
                chunk = JSON.parse(chunk.toString());
            }
            catch (err) {
                return done(err);
            }
        }
        this.serverType.execute(chunk).then((result) => {
            this.push(result);
            if (typeof done == "function")
                done();
        }, done);
    }
    _flush(done) {
        if (typeof done == "function")
            done();
    }
    static createProcessor(context, options) {
        return new processor_1.ODataProcessor(context, this, options);
    }
    static $metadata(metadata) {
        if (metadata) {
            if (!(metadata instanceof odata_v4_metadata_1.Edm.Edmx)) {
                if (metadata.version && metadata.dataServices && Array.isArray(metadata.dataServices.schema))
                    this._metadataCache = odata_v4_service_metadata_1.ServiceMetadata.processMetadataJson(metadata);
                else
                    this._metadataCache = odata_v4_service_metadata_1.ServiceMetadata.defineEntities(metadata);
            }
        }
        return this._metadataCache || (this._metadataCache = odata_v4_service_metadata_1.ServiceMetadata.processMetadataJson(metadata_1.createMetadataJSON(this)));
    }
    static document() {
        return odata_v4_service_document_1.ServiceDocument.processEdmx(this.$metadata().edmx);
    }
    static addController(controller, entitySetName, elementType) {
        odata_1.odata.controller(controller, entitySetName, elementType)(this);
    }
    static getController(elementType) {
        for (let i in this.prototype) {
            if (this.prototype[i] &&
                this.prototype[i].prototype &&
                this.prototype[i].prototype instanceof controller_1.ODataController &&
                this.prototype[i].prototype.elementType == elementType) {
                return this.prototype[i];
            }
        }
        return null;
    }
    static create(path, port, hostname) {
        let server = this;
        let router = express.Router();
        router.use(bodyParser.json());
        if (server.cors)
            router.use(cors());
        router.get("/", server.document().requestHandler());
        router.get("/\\$metadata", server.$metadata().requestHandler());
        router.use(server.requestHandler());
        router.use(ODataErrorHandler);
        if (typeof path == "number") {
            if (typeof port == "string") {
                hostname = "" + port;
            }
            port = parseInt(path, 10);
            path = undefined;
        }
        if (typeof port == "number") {
            let app = express();
            app.use(path || "/", router);
            app.listen(port, hostname);
        }
        return router;
    }
}
exports.ODataServer = ODataServer;
function ODataErrorHandler(err, req, res, next) {
    if (err) {
        console.log(err);
        res.status(err.statusCode || 500);
        res.send({
            error: err.message,
            stack: err.stack
        });
    }
    else
        next();
}
exports.ODataErrorHandler = ODataErrorHandler;
function createODataServer(server, path, port, hostname) {
    return server.create(path, port, hostname);
}
exports.createODataServer = createODataServer;
//# sourceMappingURL=server.js.map