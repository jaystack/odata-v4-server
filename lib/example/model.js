"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const mongodb_1 = require("mongodb");
const index_1 = require("../index");
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
//# sourceMappingURL=model.js.map