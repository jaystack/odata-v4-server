/// <reference types="mocha" />
let expect = require("chai").expect;
import * as assert from "assert";
import * as extend from "extend";
import { Token } from "odata-v4-parser/lib/lexer";
import { createFilter } from "odata-v4-inmemory";
import { ObjectID } from "mongodb";
import { ODataController, ODataServer, ODataProcessor, ODataMethodType, ODataResult, Edm, odata } from "../lib/index";
import { Product, Category } from "../example/model";
let categories = require("../example/categories");
let products = require("../example/products");

class Foobar{
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    id:number

    @Edm.Int16
    a:number

    @Edm.String
    foo:string

    @Edm.Action
    Foo(){}

    @Edm.Function(Edm.String)
    Bar(){
        return "foobar";
    }

    @odata.namespace("Echo")
    @Edm.Function(Edm.Collection(Edm.String))
    echo(@Edm.String message){
        return [message];
    }
}

@odata.type(Foobar)
class SyncTestController extends ODataController{
    @odata.GET
    entitySet(@odata.query query:Token, @odata.context context:any, @odata.result result:any, @odata.stream stream:ODataProcessor){
        return [{ id: 1,  a: 1 }];
    }

    @odata.GET()
    entity(@odata.key() key:number){
        return ODataResult.Ok({ id: key, foo: "bar" });
    }

    @odata.method("POST")
    insert(@odata.body body:any){
        body.id = 1;
        return body;
    }

    put(@odata.body body:any){
        body.id = 1;
        return body;
    }

    patch(@odata.key key:number, @odata.body delta:any){
        return extend({
            id: key,
            foo: "bar"
        }, delta);
    }

    @odata.method(ODataMethodType.DELETE)
    remove(){}
}

@odata.type(Foobar)
class GeneratorTestController extends ODataController{
    @odata.GET
    *entitySet(){
        return [{ id: 1, a: 1 }];
    }
}

@odata.type(Foobar)
class AsyncTestController extends ODataController{
    @odata.GET
    entitySet(){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve([{ id: 1, a: 1 }]);
            });
        });
    }

    @odata.GET
    entity(@odata.key key:number){
        return ODataResult.Ok(new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({ id: key });
            });
        }));
    }

    @odata.POST
    insert(@odata.body body:any){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                body.id = 1;
                resolve(body);
            });
        });
    }
}

@odata.type(Foobar)
class InlineCountController extends ODataController{
    @odata.GET
    entitySet(){
        let result = [{ id: 1, a: 1 }];
        (<any>result).inlinecount = 1;
        return result;
    }
}

@odata.type(Foobar)
class BoundOperationController extends ODataController{
    @Edm.Action
    Action(){
        return new Promise((resolve) => {
            setTimeout(resolve);
        });
    }

    @Edm.Function(Edm.String)
    Function(@Edm.Int16 value:number){
        return "foobar";
    }

    @Edm.Function(Edm.String)
    FunctionMore(@Edm.String message:string, @Edm.Int64 value:number){
        return `The number is ${value} and your message was ${message}.`;
    }

    @odata.GET
    entitySet(){
        return [{ id: 1, a: 1 }];
    }

    @odata.GET
    entity(@odata.key key:number){
        return { id: key, a: 1 };
    }
}

@odata.type(Product)
@Edm.EntitySet("Products")
class ProductsController extends ODataController{
    @odata.GET
    find(@odata.filter filter:Token):Product[]{
        if (filter) return products.map((product) => extend(extend({}, product), { _id: product._id.toString(), CategoryId: product.CategoryId.toString() })).filter(createFilter(filter));
        return products;
    }

    @odata.GET
    findOne(@odata.key key:string):Product{
        return products.filter(product => product._id.toString() == key)[0] || null;
    }
}

@odata.type(Category)
@Edm.EntitySet("Categories")
class CategoriesController extends ODataController{
    @odata.GET
    find(@odata.filter filter:Token):Category[]{
        if (filter) return categories.map((category) => extend(extend({}, category), { _id: category._id.toString() })).filter(createFilter(filter));
        return categories;
    }

    @odata.GET
    findOne(@odata.key key:string, @odata.result result:any):Category{
        return categories.filter(category => category._id.toString() == key)[0] || null;
    }
}

class Location{
    @Edm.String
    City:string

    @Edm.String
    Address:string

    constructor(city, address){
        this.City = city;
        this.Address = address;
    }
}

class User{
    @Edm.Key
    @Edm.Int32
    Id:number

    @Edm.ComplexType(Location)
    Location:Location

    constructor(id, location){
        this.Id = id;
        this.Location = location;
    }
}

class UsersController extends ODataController{
    @odata.GET
    find(){
        return [new User(1, new Location("Budapest", "Virág utca"))];
    }

    @odata.GET
    findOne(@odata.key key:number){
        return new User(1, new Location("Budapest", "Virág utca"));
    }

    @odata.namespace("Session")
    @Edm.Action
    logout(){}
}

class HiddenController extends ODataController{}

@odata.cors
@odata.controller(SyncTestController, "EntitySet")
@odata.controller(GeneratorTestController, "GeneratorEntitySet")
@odata.controller(AsyncTestController, "AsyncEntitySet")
@odata.controller(InlineCountController, "InlineCountEntitySet")
@odata.controller(BoundOperationController, "BoundOperationEntitySet")
@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, true)
@odata.controller(UsersController, true, User)
@odata.controller(HiddenController)
@odata.container("TestContainer")
class TestServer extends ODataServer{
    @Edm.ActionImport
    ActionImport(){
        return new Promise((resolve) => {
            setTimeout(resolve);
        });
    }

    @Edm.ActionImport
    ActionImportParams(@Edm.Int32 value:number){
        if (typeof value != "number") throw new Error("value is not a number!");
    }

    @Edm.FunctionImport(Edm.String)
    FunctionImport(@Edm.Int64 value:number){
        return `The number is ${value}.`;
    }

    @Edm.FunctionImport(Edm.String)
    FunctionImportMore(@Edm.String message:string, @Edm.Int64 value:number){
        return `The number is ${value} and your message was ${message}.`;
    }
}
TestServer.$metadata();

@odata.namespace("Authentication")
@odata.controller(UsersController, true)
class AuthenticationServer extends ODataServer{
    @odata.namespace("Echo")
    @Edm.FunctionImport(Edm.String)
    echo(@Edm.String message:string):string{
        return message;
    }
}

class NoServer extends ODataServer{}

function createTest(testcase:string, server:typeof ODataServer, command:string, compare:any, body?:any){
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        return server.execute(test.slice(1).join(" "), test[0], body).then((result) => {
            expect(result).to.deep.equal(compare);
        });
    });
}

describe("ODataServer", () => {
    describe("OData CRUD", () => {
        createTest("should return entity set result", TestServer, "GET /EntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#EntitySet",
                value: [{
                    "@odata.id": "http://localhost/EntitySet(1)",
                    "@odata.editLink": "http://localhost/EntitySet(1)",
                    id: 1,
                    a: 1
                }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });

        createTest("should return entity set result using generator function", TestServer, "GET /GeneratorEntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#GeneratorEntitySet",
                value: [{
                    "@odata.id": "http://localhost/GeneratorEntitySet(1)",
                    id: 1,
                    a: 1
                }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });

        createTest("should return entity set result using async function", TestServer, "GET /AsyncEntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#AsyncEntitySet",
                value: [{
                    "@odata.id": "http://localhost/AsyncEntitySet(1)",
                    id: 1,
                    a: 1
                }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });

        createTest("should return entity set result with inline count", TestServer, "GET /InlineCountEntitySet?$count=true", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#InlineCountEntitySet",
                "@odata.count": 1,
                value: [{
                    "@odata.id": "http://localhost/InlineCountEntitySet(1)",
                    id: 1,
                    a: 1
                }]
            },
            elementType: Foobar,
            contentType: "application/json"
        });

        createTest("should return entity by key", TestServer, "GET /EntitySet(1)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                "@odata.id": "http://localhost/EntitySet(1)",
                "@odata.editLink": "http://localhost/EntitySet(1)",
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
                "@odata.id": "http://localhost/EntitySet(1)",
                "@odata.editLink": "http://localhost/EntitySet(1)",
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
                value: products.filter(product => product.CategoryId.toString() == "578f2baa12eaebabec4af289").map(product => extend({
                    "@odata.id": `http://localhost/Products('${product._id}')`
                }, product))
            },
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return entity collection navigation property result with filter", TestServer, "GET /Categories('578f2baa12eaebabec4af289')/Products?$filter=Name eq 'Chai'", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories('578f2baa12eaebabec4af289')/Products",
                value: products.filter(product => product.CategoryId.toString() == "578f2baa12eaebabec4af289" && product.Name == "Chai").map(product => extend({
                    "@odata.id": "http://localhost/Products('578f2b8c12eaebabec4af23c')"
                }, product))
            },
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return entity collection navigation property result", TestServer, "GET /Categories('578f2baa12eaebabec4af289')/Products('578f2b8c12eaebabec4af23c')", {
            statusCode: 200,
            body: extend({
                "@odata.context": "http://localhost/$metadata#Products/$entity",
                "@odata.id": "http://localhost/Products('578f2b8c12eaebabec4af23c')"
            }, products.filter(product => product._id.toString() == "578f2b8c12eaebabec4af23c")[0]),
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return entity navigation property result", TestServer, "GET /Products('578f2b8c12eaebabec4af23c')/Category", {
            statusCode: 200,
            body: extend({
                "@odata.context": "http://localhost/$metadata#Categories/$entity",
                "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af289')",
            }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af289")[0]),
            elementType: Category,
            contentType: "application/json"
        });

        createTest("should return result including complex type", AuthenticationServer, "GET /Users", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users",
                value: [extend(new User(1, new Location("Budapest", "Virág utca")), {
                    "@odata.id": "http://localhost/Users(1)"
                })]
            },
            elementType: User,
            contentType: "application/json"
        });

        console.log(new Object());
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
            expect(odata.getPublicControllers(NoServer)).to.deep.equal({});
        });

        it("should not allow non-OData methods", () => {
            try{
                NoServer.execute("/dev/null", "MERGE");
                throw new Error("MERGE should not be allowed");
            }catch(err){
                expect(err.message).to.equal("Method not allowed.");
            }
        });

        it("should throw resource not found error", () => {
            return AuthenticationServer.execute("/Users", "DELETE").then(() => {
                throw new Error("should throw error");
            }, (err) => {
                expect(err.message).to.equal("Resource not found.");
            });
        });
    })
});