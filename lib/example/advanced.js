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
const mongodb_1 = require("mongodb");
const FilterVisitor_1 = require("odata-v4-inmemory/lib/FilterVisitor");
const visitor_1 = require("odata-v4-mongodb/lib/visitor");
const index_1 = require("../index");
let categories = require("./categories");
let products = require("./products");
const toObjectID = _id => _id && !(_id instanceof mongodb_1.ObjectID) ? mongodb_1.ObjectID.createFromHexString(_id) : _id;
let Product = class Product extends index_1.Entity {
};
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
    })
], Product.prototype, "_id", void 0);
__decorate([
    index_1.Edm.String(),
    index_1.Edm.Required(),
    index_1.Edm.Convert(toObjectID)
], Product.prototype, "CategoryId", void 0);
__decorate([
    index_1.Edm.ForeignKey("CategoryId"),
    index_1.Edm.EntityType("Category")
], Product.prototype, "Category", void 0);
__decorate([
    index_1.Edm.Boolean()
], Product.prototype, "Discontinued", void 0);
__decorate([
    index_1.Edm.String(),
    index_1.Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product title"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
], Product.prototype, "Name", void 0);
__decorate([
    index_1.Edm.String(),
    index_1.Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product English name"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
], Product.prototype, "QuantityPerUnit", void 0);
__decorate([
    index_1.Edm.Decimal(),
    index_1.Edm.Annotate({
        term: "UI.DisplayName",
        string: "Unit price of product"
    }, {
        term: "UI.ControlHint",
        string: "Decimal"
    })
], Product.prototype, "UnitPrice", void 0);
Product = __decorate([
    index_1.Edm.Annotate({
        term: "UI.DisplayName",
        string: "Products"
    })
], Product);
exports.Product = Product;
let Category = class Category extends index_1.Entity {
};
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
    })
], Category.prototype, "_id", void 0);
__decorate([
    index_1.Edm.String()
], Category.prototype, "Description", void 0);
__decorate([
    index_1.Edm.String(),
    index_1.Edm.Annotate({
        term: "UI.DisplayName",
        string: "Category name"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
], Category.prototype, "Name", void 0);
__decorate([
    index_1.Edm.ForeignKey("CategoryId"),
    index_1.Edm.Collection(index_1.Edm.EntityType("Product"))
], Category.prototype, "Products", void 0);
Category = __decorate([
    index_1.Edm.Annotate({
        term: "UI.DisplayName",
        string: "Categories"
    })
], Category);
exports.Category = Category;
const mongodb = function () {
    return __awaiter(this, void 0, void 0, function* () {
        return yield mongodb_1.MongoClient.connect("mongodb://localhost:27017/odataserver");
    });
};
let ProductsController = class ProductsController extends index_1.ODataController {
    find(filter) {
        if (filter) {
            let filterFn = new FilterVisitor_1.FilterVisitor().Visit(filter, {});
            return products.map((product) => {
                product._id = product._id.toString();
                product.CategoryId = product.CategoryId.toString();
                return product;
            }).filter((product) => filterFn(product)).map(product => new Product(product));
        }
        return products.map(product => new Product(product));
    }
    findOne(key) {
        let product = products.filter(product => product._id.toString() == key)[0];
        return product ? new Product(product) : null;
    }
};
__decorate([
    index_1.odata.method("GET"),
    __param(0, index_1.odata.filter())
], ProductsController.prototype, "find", null);
__decorate([
    index_1.odata.method("GET"),
    __param(0, index_1.odata.key())
], ProductsController.prototype, "findOne", null);
ProductsController = __decorate([
    index_1.odata.type(Product),
    index_1.Edm.EntitySet("Products")
], ProductsController);
exports.ProductsController = ProductsController;
let CategoriesController = class CategoriesController extends index_1.ODataController {
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let mongodbQuery = new visitor_1.Visitor().Visit(query);
            return yield (yield mongodb()).collection("Categories").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).toArray().then((categories) => categories.map(category => new Category(category)));
        });
    }
    findOne(key, query) {
        return __awaiter(this, void 0, void 0, function* () {
            let mongodbQuery = new visitor_1.Visitor().Visit(query);
            return yield (yield mongodb()).collection("Categories").findOne({ _id: new mongodb_1.ObjectID(key) }, {
                fields: mongodbQuery.projection
            }).then((category) => new Category(category));
        });
    }
};
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.query())
], CategoriesController.prototype, "find", null);
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.key()),
    __param(1, index_1.odata.query())
], CategoriesController.prototype, "findOne", null);
CategoriesController = __decorate([
    index_1.odata.type(Category),
    index_1.Edm.EntitySet("Categories")
], CategoriesController);
exports.CategoriesController = CategoriesController;
let NorthwindODataServer = class NorthwindODataServer extends index_1.ODataServer {
    initDb() {
        return __awaiter(this, void 0, void 0, function* () {
            let db = yield mongodb();
            yield db.dropDatabase();
            let categoryCollection = db.collection("Categories");
            let productsCollection = db.collection("Products");
            yield categoryCollection.insertMany(categories);
            yield productsCollection.insertMany(products);
        });
    }
};
__decorate([
    index_1.Edm.ActionImport()
], NorthwindODataServer.prototype, "initDb", null);
NorthwindODataServer = __decorate([
    index_1.odata.namespace("Northwind"),
    index_1.odata.container("NorthwindContext"),
    index_1.odata.controller(ProductsController),
    index_1.odata.controller(CategoriesController),
    index_1.odata.cors()
], NorthwindODataServer);
exports.NorthwindODataServer = NorthwindODataServer;
index_1.createODataServer(NorthwindODataServer, "/odata", 3000);
//# sourceMappingURL=advanced.js.map