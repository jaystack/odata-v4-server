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
const mongodb_1 = require("mongodb");
const FilterVisitor_1 = require("odata-v4-inmemory/lib/FilterVisitor");
const extend = require("extend");
const index_1 = require("../index");
let categories = require("./categories");
let products = require("./products");
class ProductsController extends index_1.ODataController {
    find(filter) {
        if (filter) {
            let filterFn = new FilterVisitor_1.FilterVisitor().Visit(filter, {});
            return products.map((product) => {
                product._id = product._id.toString();
                product.CategoryId = product.CategoryId.toString();
                return product;
            }).filter((product) => filterFn(product)).map(product => product);
        }
        return products.map(product => product);
    }
    findOne(key) {
        let product = products.filter(product => product._id.toString() == key)[0];
        return product ? product : null;
    }
    insert(product) {
        product._id = new mongodb_1.ObjectID();
        products.push(product);
        return product;
    }
    update(key, delta) {
        let product = products.filter(product => product._id.toString() == key)[0];
        extend(product, delta);
    }
}
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.filter())
], ProductsController.prototype, "find", null);
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.key())
], ProductsController.prototype, "findOne", null);
__decorate([
    index_1.odata.POST(),
    __param(0, index_1.odata.body())
], ProductsController.prototype, "insert", null);
__decorate([
    index_1.odata.PATCH(),
    __param(0, index_1.odata.key()),
    __param(1, index_1.odata.body())
], ProductsController.prototype, "update", null);
exports.ProductsController = ProductsController;
class CategoriesController extends index_1.ODataController {
    find(filter) {
        if (filter) {
            let filterFn = new FilterVisitor_1.FilterVisitor().Visit(filter, {});
            return categories.map((category) => {
                category._id = category._id.toString();
                return category;
            }).filter((category) => filterFn(category));
        }
        return categories;
    }
    findOne(key) {
        let category = categories.filter(category => category._id.toString() == key)[0];
        return category || null;
    }
    insert(category) {
        category._id = new mongodb_1.ObjectID();
        categories.push(category);
        return category;
    }
    update(key, delta) {
        let category = categories.filter(category => category._id.toString() == key)[0];
        extend(category, delta);
    }
}
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.filter())
], CategoriesController.prototype, "find", null);
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.key())
], CategoriesController.prototype, "findOne", null);
__decorate([
    index_1.odata.POST(),
    __param(0, index_1.odata.body())
], CategoriesController.prototype, "insert", null);
__decorate([
    index_1.odata.PATCH(),
    __param(0, index_1.odata.key()),
    __param(1, index_1.odata.body())
], CategoriesController.prototype, "update", null);
exports.CategoriesController = CategoriesController;
let NorthwindODataServer = class NorthwindODataServer extends index_1.ODataServer {
};
NorthwindODataServer = __decorate([
    index_1.odata.cors(),
    index_1.odata.controller(ProductsController, true),
    index_1.odata.controller(CategoriesController, true)
], NorthwindODataServer);
exports.NorthwindODataServer = NorthwindODataServer;
index_1.createODataServer(NorthwindODataServer, "/odata", 3000);
//# sourceMappingURL=simple.js.map