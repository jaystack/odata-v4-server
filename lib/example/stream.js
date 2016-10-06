"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require("fs");
const path = require("path");
const mongodb_1 = require("mongodb");
const visitor_1 = require("odata-v4-mongodb/lib/visitor");
const index_1 = require("../index");
const model_1 = require("./model");
const mongodb = function () {
    return __awaiter(this, void 0, void 0, function* () {
        return yield mongodb_1.MongoClient.connect("mongodb://localhost:27017/odataserver");
    });
};
let ProductsController = class ProductsController extends index_1.ODataController {
    *find(query, stream) {
        let db = yield mongodb();
        let mongodbQuery = new visitor_1.Visitor().Visit(query);
        if (typeof mongodbQuery.query._id == "string")
            mongodbQuery.query._id = new mongodb_1.ObjectID(mongodbQuery.query._id);
        if (typeof mongodbQuery.query.CategoryId == "string")
            mongodbQuery.query.CategoryId = new mongodb_1.ObjectID(mongodbQuery.query.CategoryId);
        return db.collection("Products")
            .find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).stream().pipe(stream);
    }
    *findOne(key, query) {
        let db = yield mongodb();
        let mongodbQuery = new visitor_1.Visitor().Visit(query);
        return db.collection("Products").findOne({ _id: new mongodb_1.ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }
};
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.query()),
    __param(1, index_1.odata.stream())
], ProductsController.prototype, "find", null);
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.key()),
    __param(1, index_1.odata.query())
], ProductsController.prototype, "findOne", null);
ProductsController = __decorate([
    index_1.odata.type(model_1.Product)
], ProductsController);
let CategoriesController = class CategoriesController extends index_1.ODataController {
    *find(query, stream) {
        let db = yield mongodb();
        let mongodbQuery = new visitor_1.Visitor().Visit(query);
        if (typeof mongodbQuery.query._id == "string")
            mongodbQuery.query._id = new mongodb_1.ObjectID(mongodbQuery.query._id);
        return db.collection("Categories")
            .find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).stream().pipe(stream);
    }
    *findOne(key, query) {
        let db = yield mongodb();
        let mongodbQuery = new visitor_1.Visitor().Visit(query);
        return db.collection("Categories").findOne({ _id: new mongodb_1.ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }
};
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.query()),
    __param(1, index_1.odata.stream())
], CategoriesController.prototype, "find", null);
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.key()),
    __param(1, index_1.odata.query())
], CategoriesController.prototype, "findOne", null);
CategoriesController = __decorate([
    index_1.odata.type(model_1.Category)
], CategoriesController);
let StreamServer = class StreamServer extends index_1.ODataServer {
    Fetch(filename, stream, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = fs.createReadStream(filename);
            context.response.contentType(path.extname(filename));
            return file.on("open", () => {
                file.pipe(stream);
            });
        });
    }
};
__decorate([
    index_1.Edm.FunctionImport(index_1.Edm.Stream),
    __param(0, index_1.Edm.String()),
    __param(1, index_1.odata.stream()),
    __param(2, index_1.odata.context())
], StreamServer.prototype, "Fetch", null);
StreamServer = __decorate([
    index_1.odata.controller(ProductsController, true),
    index_1.odata.controller(CategoriesController, true)
], StreamServer);
StreamServer.create("/odata", 3000);
//# sourceMappingURL=stream.js.map