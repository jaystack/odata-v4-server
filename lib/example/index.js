"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var es6_promise_1 = require("es6-promise");
var mongodb_1 = require("mongodb");
var index_1 = require("../index");
var categories = require("./categories");
var products = require("./products");
var toObjectID = function (_id) { return _id && !(_id instanceof mongodb_1.ObjectID) ? mongodb_1.ObjectID.createFromHexString(_id) : _id; };
var Product = (function (_super) {
    __extends(Product, _super);
    function Product() {
        _super.apply(this, arguments);
    }
    __decorate([
        index_1.Edm.Key(),
        index_1.Edm.Computed(),
        index_1.Edm.String(),
        index_1.Edm.Convert(toObjectID),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Product identifier"
        }, {
            term: "UI.ControlHint",
            string: "ReadOnly"
        }), 
        __metadata('design:type', mongodb_1.ObjectID)
    ], Product.prototype, "_id", void 0);
    __decorate([
        index_1.Edm.String(),
        index_1.Edm.Required(),
        index_1.Edm.Convert(toObjectID), 
        __metadata('design:type', String)
    ], Product.prototype, "CategoryId", void 0);
    __decorate([
        index_1.Edm.Boolean(), 
        __metadata('design:type', Boolean)
    ], Product.prototype, "Discontinued", void 0);
    __decorate([
        index_1.Edm.String(),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Product title"
        }, {
            term: "UI.ControlHint",
            string: "ShortText"
        }), 
        __metadata('design:type', String)
    ], Product.prototype, "Name", void 0);
    __decorate([
        index_1.Edm.String(),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Product English name"
        }, {
            term: "UI.ControlHint",
            string: "ShortText"
        }), 
        __metadata('design:type', String)
    ], Product.prototype, "QuantityPerUnit", void 0);
    __decorate([
        index_1.Edm.Decimal(),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Unit price of product"
        }, {
            term: "UI.ControlHint",
            string: "Decimal"
        }), 
        __metadata('design:type', Number)
    ], Product.prototype, "UnitPrice", void 0);
    Product = __decorate([
        index_1.odata.namespace("Northwind"),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Products"
        }), 
        __metadata('design:paramtypes', [])
    ], Product);
    return Product;
}(index_1.Entity));
exports.Product = Product;
var Category = (function (_super) {
    __extends(Category, _super);
    function Category() {
        _super.apply(this, arguments);
    }
    __decorate([
        index_1.Edm.Key(),
        index_1.Edm.Computed(),
        index_1.Edm.String(),
        index_1.Edm.Convert(toObjectID),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Category identifier"
        }, {
            term: "UI.ControlHint",
            string: "ReadOnly"
        }), 
        __metadata('design:type', mongodb_1.ObjectID)
    ], Category.prototype, "_id", void 0);
    __decorate([
        index_1.Edm.String(), 
        __metadata('design:type', String)
    ], Category.prototype, "Description", void 0);
    __decorate([
        index_1.Edm.String(),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Category name"
        }, {
            term: "UI.ControlHint",
            string: "ShortText"
        }), 
        __metadata('design:type', String)
    ], Category.prototype, "Name", void 0);
    Category = __decorate([
        index_1.odata.namespace("Northwind"),
        index_1.Edm.Annotate({
            term: "UI.DisplayName",
            string: "Categories"
        }), 
        __metadata('design:paramtypes', [])
    ], Category);
    return Category;
}(index_1.Entity));
exports.Category = Category;
var ProductsController = (function (_super) {
    __extends(ProductsController, _super);
    function ProductsController() {
        _super.apply(this, arguments);
    }
    ProductsController = __decorate([
        index_1.odata.namespace("Northwind"),
        index_1.odata.context("Products"),
        index_1.odata.type(Product), 
        __metadata('design:paramtypes', [])
    ], ProductsController);
    return ProductsController;
}(index_1.ODataMongoDBController));
exports.ProductsController = ProductsController;
var CategoriesController = (function (_super) {
    __extends(CategoriesController, _super);
    function CategoriesController() {
        _super.apply(this, arguments);
    }
    CategoriesController = __decorate([
        index_1.odata.namespace("Northwind"),
        index_1.odata.context("Categories"),
        index_1.odata.type(Category), 
        __metadata('design:paramtypes', [])
    ], CategoriesController);
    return CategoriesController;
}(index_1.ODataMongoDBController));
exports.CategoriesController = CategoriesController;
var NorthwindODataServer = (function (_super) {
    __extends(NorthwindODataServer, _super);
    function NorthwindODataServer() {
        _super.apply(this, arguments);
    }
    NorthwindODataServer.prototype.initDb = function () {
        var provider = new index_1.MongoDBProvider(this.configuration);
        return provider.connect().then(function (db) {
            return db.dropDatabase().then(function () {
                var categoryCollection = db.collection("Categories");
                var productsCollection = db.collection("Products");
                return es6_promise_1.Promise.all([categoryCollection.insertMany(categories), productsCollection.insertMany(products)]);
            });
        });
    };
    __decorate([
        index_1.Edm.ActionImport(), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', es6_promise_1.Promise)
    ], NorthwindODataServer.prototype, "initDb", null);
    NorthwindODataServer = __decorate([
        index_1.odata.namespace("JayStack"),
        index_1.odata.container("NorthwindContext"),
        index_1.odata.controller(ProductsController),
        index_1.odata.controller(CategoriesController),
        index_1.odata.config({
            uri: "mongodb://localhost:27017/odataserver"
        }),
        index_1.odata.cors(), 
        __metadata('design:paramtypes', [])
    ], NorthwindODataServer);
    return NorthwindODataServer;
}(index_1.ODataServer));
exports.NorthwindODataServer = NorthwindODataServer;
index_1.createODataServer(NorthwindODataServer, "/odata", 3000);
//# sourceMappingURL=index.js.map