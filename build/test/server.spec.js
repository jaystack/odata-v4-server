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
/// <reference types="mocha" />
const assert = require("assert");
const extend = require("extend");
const odata_v4_inmemory_1 = require("odata-v4-inmemory");
const index_1 = require("../lib/index");
const model_1 = require("../example/model");
let categories = require("../example/categories");
let products = require("../example/products");
class Foobar {
    Foo() { }
    Bar() {
        return "foobar";
    }
    echo(message) {
        return [message];
    }
}
__decorate([
    index_1.Edm.Key,
    index_1.Edm.Computed,
    index_1.Edm.Int32
], Foobar.prototype, "id", void 0);
__decorate([
    index_1.Edm.Int16
], Foobar.prototype, "a", void 0);
__decorate([
    index_1.Edm.String
], Foobar.prototype, "foo", void 0);
__decorate([
    index_1.Edm.Action
], Foobar.prototype, "Foo", null);
__decorate([
    index_1.Edm.Function(index_1.Edm.String)
], Foobar.prototype, "Bar", null);
__decorate([
    index_1.odata.namespace("Echo"),
    index_1.Edm.Function(index_1.Edm.Collection(index_1.Edm.String)),
    __param(0, index_1.Edm.String)
], Foobar.prototype, "echo", null);
let SyncTestController = class SyncTestController extends index_1.ODataController {
    entitySet(query, context, result, stream) {
        return [{ a: 1 }];
    }
    entity(key) {
        return index_1.ODataResult.Ok({ id: key, foo: "bar" });
    }
    insert(body) {
        body.id = 1;
        return body;
    }
    put(body) {
        body.id = 1;
        return body;
    }
    patch(key, delta) {
        return extend({
            id: key,
            foo: "bar"
        }, delta);
    }
    remove() { }
};
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.query),
    __param(1, index_1.odata.context),
    __param(2, index_1.odata.result),
    __param(3, index_1.odata.stream)
], SyncTestController.prototype, "entitySet", null);
__decorate([
    index_1.odata.GET(),
    __param(0, index_1.odata.key())
], SyncTestController.prototype, "entity", null);
__decorate([
    index_1.odata.method("POST"),
    __param(0, index_1.odata.body)
], SyncTestController.prototype, "insert", null);
__decorate([
    __param(0, index_1.odata.body)
], SyncTestController.prototype, "put", null);
__decorate([
    __param(0, index_1.odata.key),
    __param(1, index_1.odata.body)
], SyncTestController.prototype, "patch", null);
__decorate([
    index_1.odata.method(index_1.ODataMethodType.DELETE)
], SyncTestController.prototype, "remove", null);
SyncTestController = __decorate([
    index_1.odata.type(Foobar)
], SyncTestController);
let GeneratorTestController = class GeneratorTestController extends index_1.ODataController {
    *entitySet() {
        return [{ a: 1 }];
    }
};
__decorate([
    index_1.odata.GET
], GeneratorTestController.prototype, "entitySet", null);
GeneratorTestController = __decorate([
    index_1.odata.type(Foobar)
], GeneratorTestController);
let AsyncTestController = class AsyncTestController extends index_1.ODataController {
    entitySet() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve([{ a: 1 }]);
            });
        });
    }
    entity(key) {
        return index_1.ODataResult.Ok(new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({ id: key });
            });
        }));
    }
    insert(body) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                body.id = 1;
                resolve(body);
            });
        });
    }
};
__decorate([
    index_1.odata.GET
], AsyncTestController.prototype, "entitySet", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], AsyncTestController.prototype, "entity", null);
__decorate([
    index_1.odata.POST,
    __param(0, index_1.odata.body)
], AsyncTestController.prototype, "insert", null);
AsyncTestController = __decorate([
    index_1.odata.type(Foobar)
], AsyncTestController);
let InlineCountController = class InlineCountController extends index_1.ODataController {
    entitySet() {
        let result = [{ a: 1 }];
        result.inlinecount = 1;
        return result;
    }
};
__decorate([
    index_1.odata.GET
], InlineCountController.prototype, "entitySet", null);
InlineCountController = __decorate([
    index_1.odata.type(Foobar)
], InlineCountController);
let BoundOperationController = class BoundOperationController extends index_1.ODataController {
    Action() {
        return new Promise((resolve) => {
            setTimeout(resolve);
        });
    }
    Function(value) {
        return "foobar";
    }
    FunctionMore(message, value) {
        return `The number is ${value} and your message was ${message}.`;
    }
    entitySet() {
        return [{ a: 1 }];
    }
    entity(key) {
        return { a: 1 };
    }
};
__decorate([
    index_1.Edm.Action
], BoundOperationController.prototype, "Action", null);
__decorate([
    index_1.Edm.Function(index_1.Edm.String),
    __param(0, index_1.Edm.Int16)
], BoundOperationController.prototype, "Function", null);
__decorate([
    index_1.Edm.Function(index_1.Edm.String),
    __param(0, index_1.Edm.String),
    __param(1, index_1.Edm.Int64)
], BoundOperationController.prototype, "FunctionMore", null);
__decorate([
    index_1.odata.GET
], BoundOperationController.prototype, "entitySet", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], BoundOperationController.prototype, "entity", null);
BoundOperationController = __decorate([
    index_1.odata.type(Foobar)
], BoundOperationController);
let ProductsController = class ProductsController extends index_1.ODataController {
    find(filter) {
        if (filter)
            return products.map((product) => extend(extend({}, product), { _id: product._id.toString(), CategoryId: product.CategoryId.toString() })).filter(odata_v4_inmemory_1.createFilter(filter));
        return products;
    }
    findOne(key) {
        return products.filter(product => product._id.toString() == key)[0] || null;
    }
};
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.filter)
], ProductsController.prototype, "find", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], ProductsController.prototype, "findOne", null);
ProductsController = __decorate([
    index_1.odata.type(model_1.Product),
    index_1.Edm.EntitySet("Products")
], ProductsController);
let CategoriesController = class CategoriesController extends index_1.ODataController {
    find(filter) {
        if (filter)
            return categories.map((category) => extend(extend({}, category), { _id: category._id.toString() })).filter(odata_v4_inmemory_1.createFilter(filter));
        return categories;
    }
    findOne(key) {
        return categories.filter(category => category._id.toString() == key)[0] || null;
    }
};
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.filter)
], CategoriesController.prototype, "find", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], CategoriesController.prototype, "findOne", null);
CategoriesController = __decorate([
    index_1.odata.type(model_1.Category),
    index_1.Edm.EntitySet("Categories")
], CategoriesController);
class Location {
    constructor(city, address) {
        this.City = city;
        this.Address = address;
    }
}
__decorate([
    index_1.Edm.String
], Location.prototype, "City", void 0);
__decorate([
    index_1.Edm.String
], Location.prototype, "Address", void 0);
class User {
    constructor(id, location) {
        this.Id = id;
        this.Location = location;
    }
}
__decorate([
    index_1.Edm.Key,
    index_1.Edm.Int32
], User.prototype, "Id", void 0);
__decorate([
    index_1.Edm.ComplexType(Location)
], User.prototype, "Location", void 0);
class UsersController extends index_1.ODataController {
    find() {
        return [new User(1, new Location("Budapest", "Virág utca"))];
    }
    findOne(key) {
        return new User(1, new Location("Budapest", "Virág utca"));
    }
    logout() { }
}
__decorate([
    index_1.odata.GET
], UsersController.prototype, "find", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], UsersController.prototype, "findOne", null);
__decorate([
    index_1.odata.namespace("Session"),
    index_1.Edm.Action
], UsersController.prototype, "logout", null);
class HiddenController extends index_1.ODataController {
}
let TestServer = class TestServer extends index_1.ODataServer {
    ActionImport() {
        return new Promise((resolve) => {
            setTimeout(resolve);
        });
    }
    ActionImportParams(value) {
        if (typeof value != "number")
            throw new Error("value is not a number!");
    }
    FunctionImport(value) {
        return `The number is ${value}.`;
    }
    FunctionImportMore(message, value) {
        return `The number is ${value} and your message was ${message}.`;
    }
};
__decorate([
    index_1.Edm.ActionImport
], TestServer.prototype, "ActionImport", null);
__decorate([
    index_1.Edm.ActionImport,
    __param(0, index_1.Edm.Int32)
], TestServer.prototype, "ActionImportParams", null);
__decorate([
    index_1.Edm.FunctionImport(index_1.Edm.String),
    __param(0, index_1.Edm.Int64)
], TestServer.prototype, "FunctionImport", null);
__decorate([
    index_1.Edm.FunctionImport(index_1.Edm.String),
    __param(0, index_1.Edm.String),
    __param(1, index_1.Edm.Int64)
], TestServer.prototype, "FunctionImportMore", null);
TestServer = __decorate([
    index_1.odata.cors,
    index_1.odata.controller(SyncTestController, "EntitySet"),
    index_1.odata.controller(GeneratorTestController, "GeneratorEntitySet"),
    index_1.odata.controller(AsyncTestController, "AsyncEntitySet"),
    index_1.odata.controller(InlineCountController, "InlineCountEntitySet"),
    index_1.odata.controller(BoundOperationController, "BoundOperationEntitySet"),
    index_1.odata.controller(ProductsController, true),
    index_1.odata.controller(CategoriesController, true),
    index_1.odata.controller(UsersController, true, User),
    index_1.odata.controller(HiddenController),
    index_1.odata.container("TestContainer")
], TestServer);
let AuthenticationServer = class AuthenticationServer extends index_1.ODataServer {
    echo(message) {
        return message;
    }
};
__decorate([
    index_1.odata.namespace("Echo"),
    index_1.Edm.FunctionImport(index_1.Edm.String),
    __param(0, index_1.Edm.String)
], AuthenticationServer.prototype, "echo", null);
AuthenticationServer = __decorate([
    index_1.odata.namespace("Authentication"),
    index_1.odata.controller(UsersController, true)
], AuthenticationServer);
class NoServer extends index_1.ODataServer {
}
function createTest(testcase, server, command, compare, body) {
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        return server.execute(test.slice(1).join(" "), test[0], body).then((result) => {
            assert.deepEqual(result, compare);
        });
    });
}
describe("ODataServer", () => {
    describe("OData CRUD", () => {
        createTest("should return entity set result", TestServer, "GET /EntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#EntitySet",
                value: [{ a: 1 }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });
        createTest("should return entity set result using generator function", TestServer, "GET /GeneratorEntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#GeneratorEntitySet",
                value: [{ a: 1 }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });
        createTest("should return entity set result using async function", TestServer, "GET /AsyncEntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#AsyncEntitySet",
                value: [{ a: 1 }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });
        createTest("should return entity set result with inline count", TestServer, "GET /InlineCountEntitySet?$count=true", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#InlineCountEntitySet",
                "@odata.count": 1,
                value: [{ a: 1 }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });
        createTest("should return entity by key", TestServer, "GET /EntitySet(1)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                id: 1,
                foo: "bar"
            },
            elementType: Foobar,
            contentType: "application/json"
        });
        createTest("should insert new entity", TestServer, "POST /EntitySet", {
            statusCode: 201,
            body: {
                "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                id: 1,
                foo: "bar"
            },
            elementType: Foobar,
            contentType: "application/json"
        }, {
            foo: "bar"
        });
        createTest("should update entity", TestServer, "PUT /EntitySet(1)", {
            statusCode: 204
        }, {
            foo: "foobar"
        });
        createTest("should update entity using delta", TestServer, "PATCH /EntitySet(1)", {
            statusCode: 204
        }, {
            bar: "foo"
        });
        createTest("should delete entity", TestServer, "DELETE /EntitySet(1)", {
            statusCode: 204
        });
        createTest("should return result count", TestServer, "GET /EntitySet/$count", {
            statusCode: 200,
            body: 1,
            elementType: Number,
            contentType: "text/plain"
        });
        createTest("should return entity property", TestServer, "GET /EntitySet(1)/foo", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#EntitySet(1)/foo",
                value: "bar"
            },
            elementType: Foobar,
            contentType: "application/json"
        });
        createTest("should return entity property value", TestServer, "GET /EntitySet(1)/foo/$value", {
            statusCode: 200,
            body: "bar",
            elementType: String,
            contentType: "text/plain"
        });
        createTest("should return entity value", TestServer, "GET /EntitySet(1)/$value", {
            statusCode: 200,
            body: {
                id: 1,
                foo: "bar"
            },
            elementType: Foobar,
            contentType: "application/json"
        });
        createTest("should call action import", TestServer, "POST /ActionImport", {
            statusCode: 204
        });
        createTest("should call action import with parameters", TestServer, "POST /ActionImportParams", {
            statusCode: 204
        }, {
            value: 42
        });
        createTest("should call function import", TestServer, "GET /FunctionImport(value=42)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call function import using parameter alias", TestServer, "GET /FunctionImport(value=@value)?@value=42", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call function import with multiple parameters", TestServer, "GET /FunctionImportMore(value=42,message='hello world')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call function import with multiple parameters using parameter alias", TestServer, "GET /FunctionImportMore(value=@value,message=@message)?@value=42&@message='hello world'", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call function import with multiple parameters (different ordering)", TestServer, "GET /FunctionImportMore(message='hello world',value=42)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call bound collection action", TestServer, "POST /BoundOperationEntitySet/Default.Action", {
            statusCode: 204
        });
        createTest("should call bound entity action", TestServer, "POST /BoundOperationEntitySet(1)/Default.Foo", {
            statusCode: 204
        });
        createTest("should call bound collection function", TestServer, "GET /BoundOperationEntitySet/Default.Function(value=42)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "foobar"
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call bound entity function", TestServer, "GET /BoundOperationEntitySet(1)/Default.Bar()", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "foobar"
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call bound entity function with parameter", TestServer, "GET /BoundOperationEntitySet(1)/Echo.echo(message='my message')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Collection(Edm.String)",
                value: ["my message"]
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });
        createTest("should call bound collection function using parameter alias", TestServer, "GET /BoundOperationEntitySet/Default.Function(value=@value)?@value=42", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "foobar"
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call function import with multiple parameters", TestServer, "GET /BoundOperationEntitySet/Default.FunctionMore(value=42,message='hello world')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call function import with multiple parameters using parameter alias", TestServer, "GET /BoundOperationEntitySet/Default.FunctionMore(value=@value,message=@message)?@value=42&@message='hello world'", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should call function import with multiple parameters (different ordering)", TestServer, "GET /BoundOperationEntitySet/Default.FunctionMore(message='hello world',value=42)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "text/plain"
        });
        createTest("should return entity collection navigation property result", TestServer, "GET /Categories('578f2baa12eaebabec4af289')/Products", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories('578f2baa12eaebabec4af289')/Products",
                value: products.filter(product => product.CategoryId.toString() == "578f2baa12eaebabec4af289")
            },
            elementType: model_1.Product,
            contentType: "application/json"
        });
        createTest("should return entity collection navigation property result with filter", TestServer, "GET /Categories('578f2baa12eaebabec4af289')/Products?$filter=Name eq 'Chai'", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories('578f2baa12eaebabec4af289')/Products",
                value: products.filter(product => product.CategoryId.toString() == "578f2baa12eaebabec4af289" && product.Name == "Chai")
            },
            elementType: model_1.Product,
            contentType: "application/json"
        });
        createTest("should return entity collection navigation property result", TestServer, "GET /Categories('578f2baa12eaebabec4af289')/Products('578f2b8c12eaebabec4af23c')", {
            statusCode: 200,
            body: extend({
                "@odata.context": "http://localhost/$metadata#Categories('578f2baa12eaebabec4af289')/Products/$entity",
            }, products.filter(product => product._id.toString() == "578f2b8c12eaebabec4af23c")[0]),
            elementType: model_1.Product,
            contentType: "application/json"
        });
        createTest("should return entity navigation property result", TestServer, "GET /Products('578f2b8c12eaebabec4af23c')/Category", {
            statusCode: 200,
            body: extend({
                "@odata.context": "http://localhost/$metadata#Products('578f2b8c12eaebabec4af23c')/Category",
            }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af289")[0]),
            elementType: model_1.Category,
            contentType: "application/json"
        });
        createTest("should return result including complex type", AuthenticationServer, "GET /Users", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users",
                value: [new User(1, new Location("Budapest", "Virág utca"))]
            },
            elementType: User,
            contentType: "application/json"
        });
        createTest("should return complex type property", AuthenticationServer, "GET /Users(1)/Location", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users(1)/Location",
                value: new Location("Budapest", "Virág utca")
            },
            elementType: Location,
            contentType: "application/json"
        });
    });
    describe("Code coverage", () => {
        it("should return empty object when no public controllers on server", () => {
            assert.deepEqual(index_1.odata.getPublicControllers(NoServer), {});
        });
        it("should not allow non-OData methods", () => {
            try {
                NoServer.execute("/dev/null", "MERGE");
                throw new Error("MERGE should not be allowed");
            }
            catch (err) {
                assert.equal(err.message, "Method not allowed.");
            }
        });
        it("should throw resource not found error", () => {
            return AuthenticationServer.execute("/Users", "DELETE").then(() => {
                throw new Error("should throw error");
            }, (err) => {
                assert.equal(err.message, "Resource not found.");
            });
        });
    });
});
//# sourceMappingURL=server.spec.js.map