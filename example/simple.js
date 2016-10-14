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
const odata_v4_inmemory_1 = require("odata-v4-inmemory");
const extend = require("extend");
const index_1 = require("../lib/index");
let categories = require("./categories").map((category) => {
    category._id = category._id.toString();
    return category;
});
let products = require("./products").map((product) => {
    product._id = product._id.toString();
    product.CategoryId = product.CategoryId.toString();
    return product;
});
class ProductsController extends index_1.ODataController {
    find(filter) {
        if (filter)
            return products.filter(odata_v4_inmemory_1.createFilter(filter));
        return products;
    }
    findOne(key) {
        return products.filter(product => product._id == key)[0];
    }
    insert(product) {
        product._id = new mongodb_1.ObjectID().toString();
        products.push(product);
        return product;
    }
    update(key, delta) {
        extend(products.filter(product => product._id == key)[0], delta);
    }
    remove(key) {
        products.splice(products.indexOf(products.filter(product => product._id == key)[0]), 1);
    }
}
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.filter)
], ProductsController.prototype, "find", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], ProductsController.prototype, "findOne", null);
__decorate([
    index_1.odata.POST,
    __param(0, index_1.odata.body)
], ProductsController.prototype, "insert", null);
__decorate([
    index_1.odata.PATCH,
    __param(0, index_1.odata.key),
    __param(1, index_1.odata.body)
], ProductsController.prototype, "update", null);
__decorate([
    index_1.odata.DELETE,
    __param(0, index_1.odata.key)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController;
class CategoriesController extends index_1.ODataController {
    find(filter) {
        if (filter)
            return categories.filter(odata_v4_inmemory_1.createFilter(filter));
        return categories;
    }
    findOne(key) {
        return categories.filter(category => category._id == key)[0];
    }
    insert(category) {
        category._id = new mongodb_1.ObjectID().toString();
        categories.push(category);
        return category;
    }
    update(key, delta) {
        extend(categories.filter(category => category._id == key)[0], delta);
    }
    remove(key) {
        categories.splice(categories.indexOf(categories.filter(category => category._id == key)[0]), 1);
    }
}
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.filter)
], CategoriesController.prototype, "find", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], CategoriesController.prototype, "findOne", null);
__decorate([
    index_1.odata.POST,
    __param(0, index_1.odata.body)
], CategoriesController.prototype, "insert", null);
__decorate([
    index_1.odata.PATCH,
    __param(0, index_1.odata.key),
    __param(1, index_1.odata.body)
], CategoriesController.prototype, "update", null);
__decorate([
    index_1.odata.DELETE,
    __param(0, index_1.odata.key)
], CategoriesController.prototype, "remove", null);
exports.CategoriesController = CategoriesController;
let NorthwindODataServer = class NorthwindODataServer extends index_1.ODataServer {
};
NorthwindODataServer = __decorate([
    index_1.odata.cors,
    index_1.odata.controller(ProductsController, true),
    index_1.odata.controller(CategoriesController, true)
], NorthwindODataServer);
exports.NorthwindODataServer = NorthwindODataServer;
NorthwindODataServer.create("/odata", 3000);
//# sourceMappingURL=simple.js.map