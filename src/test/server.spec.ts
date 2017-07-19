/// <reference types="mocha" />
import { TestServer, Foobar, AuthenticationServer, Image, User, Location, Music, DefTest, DefTestServer, Product2, Category2 } from './test.model';
import { Edm, odata } from "../lib/index";
import { Product, Category } from "../example/model";
import { Meta, Media, TestEntity, MetaTestServer, CompoundKey, EmptyEntity, BaseMeta } from './metadata.spec';
import { ObjectID } from "mongodb";
const { expect } = require("chai");
const extend = require("extend");
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");

export function testFactory(createTest: any) {
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
                "foo": "bar"
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
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should return entity property value", TestServer, "GET /EntitySet(1)/foo/$value", {
            statusCode: 200,
            body: "bar",
            elementType: String,
            contentType: "text/plain"
        });

        createTest("should return entity key property value", TestServer, "GET /EntitySet(1)/id/$value", {
            statusCode: 200,
            body: 1,
            elementType: Number,
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
            contentType: "application/json"
        });

        createTest("should call function import using parameter alias", TestServer, "GET /FunctionImport(value=@value)?@value=42", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42."
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call function import using different key and parameter name", TestServer, "GET /FunctionImport(param=@test)?@test=42", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is undefined."
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call function import with multiple parameters", TestServer, "GET /FunctionImportMore(value=42,message='hello world')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call function import with multiple parameters using parameter alias", TestServer, "GET /FunctionImportMore(value=@value,message=@message)?@value=42&@message='hello world'", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call function import with multiple parameters (different ordering)", TestServer, "GET /FunctionImportMore(message='hello world',value=42)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "application/json"
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
                value: "foobar:42"
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call bound entity function", TestServer, "GET /BoundOperationEntitySet(1)/Default.Bar()", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "foobar"
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call bound entity function with parameter", TestServer, "GET /BoundOperationEntitySet(1)/Echo.echo(message='my message')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "my message"
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call bound entity function with parameter", TestServer, "GET /BoundOperationEntitySet(1)/Echo.echoMany(message='my message')", {
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
                value: "foobar:42"
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call function import with multiple parameters", TestServer, "GET /BoundOperationEntitySet/Default.FunctionMore(value=42,message='hello world')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call function import with multiple parameters using parameter alias", TestServer, "GET /BoundOperationEntitySet/Default.FunctionMore(value=@value,message=@message)?@value=42&@message='hello world'", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should call function import with multiple parameters (different ordering)", TestServer, "GET /BoundOperationEntitySet/Default.FunctionMore(message='hello world',value=42)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Edm.String",
                value: "The number is 42 and your message was hello world."
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should return entity collection navigation property result", TestServer, "GET /Categories('578f2baa12eaebabec4af290')/Products", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories('578f2baa12eaebabec4af290')/Products",
                value: products.filter(product => product.CategoryId && product.CategoryId.toString() == "578f2baa12eaebabec4af290").map(product => Object.assign({
                    "@odata.id": `http://localhost/Products('${product._id}')`
                }, product))
            },
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return entity collection navigation property result with filter", TestServer, "GET /Categories('578f2baa12eaebabec4af290')/Products?$filter=Name eq 'Pavlova'", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories('578f2baa12eaebabec4af290')/Products",
                value: products.filter(product => product.CategoryId && product.CategoryId.toString() == "578f2baa12eaebabec4af290" && product.Name == "Pavlova").map(product => Object.assign({
                    "@odata.id": "http://localhost/Products('578f2b8c12eaebabec4af248')"
                }, product))
            },
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return entity collection navigation property result", TestServer, "GET /Categories('578f2baa12eaebabec4af289')/Products('578f2b8c12eaebabec4af23c')", {
            statusCode: 200,
            body: Object.assign({
                "@odata.context": "http://localhost/$metadata#Products/$entity",
                "@odata.id": "http://localhost/Products('578f2b8c12eaebabec4af23c')"
            }, products.filter(product => product._id.toString() == "578f2b8c12eaebabec4af23c")[0]),
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return stream result set of Categories using generator function", TestServer, "GET /Categories2", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories2",
                value: categories.map(category => {
                    return Object.assign({ "@odata.id": `http://localhost/Categories2('${category._id}')` }, category)
                })
            },
            elementType: Category2,
            contentType: "application/json"
        });

        createTest("should return stream result set of Products using generator function", TestServer, "GET /Products2", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Products2",
                value: products.map(product => {
                    return Object.assign({ "@odata.id": `http://localhost/Products2('${product._id}')` }, product)
                })
            },
            elementType: Product2,
            contentType: "application/json"
        });

        createTest("should return exact Category using generator function", TestServer, "GET /Categories2('578f2baa12eaebabec4af289')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories2/$entity",
                "@odata.id": "http://localhost/Categories2('578f2baa12eaebabec4af289')",
                "Description": "Soft drinks",
                "Name": "Beverages",
                "_id": new ObjectID("578f2baa12eaebabec4af289")
            },
            elementType: Category2,
            contentType: "application/json"
        });

        createTest("should return stream result stream of Products referenced to Category using generator function", TestServer, "GET /Categories2('578f2baa12eaebabec4af290')/Products2", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories2('578f2baa12eaebabec4af290')/Products2",
                value: products.filter(product => product && product.CategoryId.toString() === "578f2baa12eaebabec4af290")
                    .map(product => {
                        return Object.assign({ "@odata.id": `http://localhost/Products2('${product._id}')` }, product)
                    })
            },
            elementType: Product2,
            contentType: "application/json"
        });

        createTest("should return product referenced to category using generator function", TestServer, "GET /Categories2('578f2baa12eaebabec4af289')/Products2('578f2b8c12eaebabec4af23c')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Products2/$entity",
                "value": [
                    {
                        "@odata.id": "http://localhost/Products2('578f2b8c12eaebabec4af23c')",
                        "Discontinued": false, "Name": "Chai", "QuantityPerUnit": "10 boxes x 20 bags",
                        "UnitPrice": 39,
                        "_id": new ObjectID("578f2b8c12eaebabec4af23c"),
                        "CategoryId": new ObjectID("578f2baa12eaebabec4af289")
                    }]
            },
            elementType: Product2,
            contentType: "application/json"
        });

        createTest("should return stream result stream of Categories referenced to Product using generator function", TestServer, "GET /Products2('578f2b8c12eaebabec4af23c')/Category2", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories2/$entity",
                "value": [
                    {
                        "@odata.id": "http://localhost/Categories2('578f2baa12eaebabec4af289')",
                        "Description": "Soft drinks",
                        "Name": "Beverages",
                        "_id": new ObjectID("578f2baa12eaebabec4af289")
                    }
                ]
            },
            elementType: Category2,
            contentType: "application/json"
        });

        // createTest("should return product reference on category", TestServer, "GET /Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref", {
        //     statusCode: 200,
        //     body: {
        //         "@odata.context": "http://localhost/$metadata#$ref",
        //         "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af28e')/Products"
        //     },
        //     elementType: Product,
        //     contentType: "application/json"
        // });

        createTest("should return product with only name and category property", TestServer, "GET /Products('578f2b8c12eaebabec4af23c')?$select=Name,CategoryId", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Products(Name,CategoryId)/$entity",
                "@odata.id": "http://localhost/Products('578f2b8c12eaebabec4af23c')",
                "Discontinued": false,
                "Name": "Chai",
                "QuantityPerUnit": "10 boxes x 20 bags",
                "UnitPrice": 39,
                "_id": new ObjectID("578f2b8c12eaebabec4af23c"),
                "CategoryId": new ObjectID("578f2baa12eaebabec4af289")
            },
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return filtered product with only name and category property", TestServer, "GET /Products?$filter=_id eq '578f2b8c12eaebabec4af23c'&$select=Name,CategoryId", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Products(Name,CategoryId)",
                "value": [{
                    "@odata.id": "http://localhost/Products('578f2b8c12eaebabec4af23c')",
                    "Discontinued": false,
                    "Name": "Chai",
                    "QuantityPerUnit": "10 boxes x 20 bags",
                    "UnitPrice": 39,
                    "_id": new ObjectID("578f2b8c12eaebabec4af23c"),
                    "CategoryId": new ObjectID("578f2baa12eaebabec4af289")
                }]
            },
            elementType: Product,
            contentType: "application/json"
        });

        createTest("should return entity navigation property result", TestServer, "GET /Products('578f2b8c12eaebabec4af23c')/Category", {
            statusCode: 200,
            body: Object.assign({
                "@odata.context": "http://localhost/$metadata#Categories/$entity",
                "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af289')",
            }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af289")[0]),
            elementType: Category,
            contentType: "application/json"
        });

        createTest("should return product name property", TestServer, "GET /Products('578f2b8c12eaebabec4af23c')/Name", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Products('578f2b8c12eaebabec4af23c')/Name",
                "value": "Chai"
            },
            elementType: "Edm.String",
            contentType: "application/json"
        });

        createTest("should return product name property value", TestServer, "GET /Products('578f2b8c12eaebabec4af23c')/Name/$value", {
            statusCode: 200,
            body:  "Chai",
            elementType: String,
            contentType: "text/plain"
        });

        createTest("should return result including complex type", AuthenticationServer, "GET /Users", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users",
                value: [Object.assign(new User(1, new Location("Budapest", "Virág utca")), {
                    "@odata.id": "http://localhost/Users(1)"
                })]
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

    describe("Stream properties", () => {
        createTest("should return stream property entity set result", TestServer, "GET /ImagesControllerEntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#ImagesControllerEntitySet",
                value: [
                    {
                        "@odata.id": "http://localhost/ImagesControllerEntitySet(1)",
                        "Id": 1,
                        "Filename": "tmp.png",
                        "Data@odata.mediaReadLink": "http://localhost/ImagesControllerEntitySet(1)/Data",
                        "Data@odata.mediaEditLink": "http://localhost/ImagesControllerEntitySet(1)/Data",
                        "Data2@odata.mediaContentType": "image/png",
                        "Data2@odata.mediaReadLink": "http://localhost/ImagesControllerEntitySet(1)/Data2",
                        "Data2@odata.mediaEditLink": "http://localhost/ImagesControllerEntitySet(1)/Data2",
                        "Data@odata.mediaContentType": "image/png"
                    }
                ]
            },
            elementType: Image,
            contentType: "application/json"
        });

        createTest("should return stream property entity by key", TestServer, "GET /ImagesControllerEntitySet(1)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#ImagesControllerEntitySet/$entity",
                "@odata.id": "http://localhost/ImagesControllerEntitySet(1)",
                "Id": 1,
                "Filename": "tmp.png",
                "Data@odata.mediaReadLink": "http://localhost/ImagesControllerEntitySet(1)/Data",
                "Data@odata.mediaEditLink": "http://localhost/ImagesControllerEntitySet(1)/Data",
                "Data2@odata.mediaContentType": "image/png",
                "Data2@odata.mediaReadLink": "http://localhost/ImagesControllerEntitySet(1)/Data2",
                "Data2@odata.mediaEditLink": "http://localhost/ImagesControllerEntitySet(1)/Data2",
                "Data@odata.mediaContentType": "image/png"
            },
            elementType: Image,
            contentType: "application/json"
        });

        createTest("should return stream result set count", TestServer, "GET /CategoriesStream('578f2baa12eaebabec4af290')/Default.Category/Products", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#CategoriesStream('578f2baa12eaebabec4af290')/Products",
                value: products.filter(product => product.CategoryId && product.CategoryId.toString() == "578f2baa12eaebabec4af290").map(product => Object.assign({
                    "@odata.id": `http://localhost/Products('${product._id}')`
                }, product))
            },
            elementType: Product,
            contentType: "application/json"
        });

        /*createTest("should return stream result set count", TestServer,"GET /CategoriesStream('578f2baa12eaebabec4af290')/Default.Category/Products/$count", {
            statusCode: 200,
            body: 13,
            elementType: Number,
            contentType: "text/plain"
        });*/
    });

    describe("Media entity", () => {
        createTest("should return media entity set result", TestServer, "GET /MusicControllerEntitySet", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#MusicControllerEntitySet",
                value: [
                    {
                        "@odata.id": "http://localhost/MusicControllerEntitySet(1)",
                        "Id": 1,
                        "@odata.mediaContentType": "audio/mp3",
                        "@odata.mediaEditLink": "http://localhost/MusicControllerEntitySet(1)/$value",
                        "@odata.mediaReadLink": "http://localhost/MusicControllerEntitySet(1)/$value",
                        "Artist": "Dream Theater",
                        "Title": "Six degrees of inner turbulence"
                    }
                ]
            },
            elementType: Music,
            contentType: "application/json"
        });

        createTest("should return media entity by key", TestServer, "GET /MusicControllerEntitySet(1)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#MusicControllerEntitySet/$entity",
                "@odata.id": "http://localhost/MusicControllerEntitySet(1)",
                "Id": 1,
                "@odata.mediaContentType": "audio/mp3",
                "@odata.mediaEditLink": "http://localhost/MusicControllerEntitySet(1)/$value",
                "@odata.mediaReadLink": "http://localhost/MusicControllerEntitySet(1)/$value",
                "Artist": "Dream Theater",
                "Title": "Six degrees of inner turbulence"
            },
            elementType: Music,
            contentType: "application/json"
        });
    });

    describe("Navigation property", () => {
        createTest("should return navigation property result", MetaTestServer, "GET /Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/Meta.Meta/MediaList", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/Meta.Meta/MediaList",
                "value": [
                    {
                        "@odata.id": "http://localhost/Media(Id=1,StringId='two')",
                        "@odata.mediaReadLink": "http://localhost/Media(Id=1,StringId='two')/$value",
                        "@odata.mediaContentType": "audio/mp3",
                        "Id": 1,
                        "StringId": "two"
                    }
                ]
            },
            elementType: Media,
            contentType: "application/json"
        });

        createTest("should return navigation property result by key", MetaTestServer, "GET /Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/Meta.Meta/MediaList(Id=1,StringId='two')", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/Meta.Meta/MediaList/$entity",
                "@odata.id": "http://localhost/Media(Id=1,StringId='two')",
                "@odata.mediaReadLink": "http://localhost/Media(Id=1,StringId='two')/$value",
                "@odata.mediaContentType": "audio/mp3",
                "Id": 1,
                "StringId": "two"
            },
            elementType: Media,
            contentType: "application/json"
        });

        createTest("should return navigation property result by key", MetaTestServer, "GET /Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/Meta.Meta/MediaList(Id=3,StringId='asd')/$ref", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#$ref",
                "@odata.id": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/MediaList"
            },
            elementType: Meta,
            contentType: "application/json"
        });
    });

    describe("Compound key", () => {
        createTest("should return CompoundKey result", MetaTestServer, "GET /CompoundKey", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#CompoundKey",
                "value": [
                    {
                        "bc0": 1,
                        "bc1": 2,
                        "bc2": true,
                        "bc3": 4,
                        "bc4": "5",
                        "bc5": 6
                    }
                ]
            },
            elementType: CompoundKey,
            contentType: "application/json"
        });

        createTest("should return CompoundKey result by keys", MetaTestServer, "GET /CompoundKey(bc0=11,bc1=22,bc2=true,bc3=44,bc4='55',bc5=66)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#CompoundKey/$entity",
                "bc0": 11,
                "bc1": 22,
                "bc2": true,
                "bc3": 44,
                "bc4": "55",
                "bc5": 66,
            },
            elementType: CompoundKey,
            contentType: "application/json"
        });

        createTest("should return Meta result", MetaTestServer, "GET /Meta", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Meta",
                "value": [
                    {
                        "@odata.id": "http://localhost/Meta('5968aad95eb7eb3a94a264f7')",
                        "@odata.type": "#Meta.BaseMeta",
                        "MongoId": new ObjectID("5968aad95eb7eb3a94a264f7"),
                        "b0": "basemeta"
                    },
                    {
                        "@odata.id": "http://localhost/Meta(MongoId='5968aad95eb7eb3a94a264f6',Id=1,p9=9,p10=10)",
                        "@odata.type": "#Meta.Meta",
                        "MongoId": new ObjectID("5968aad95eb7eb3a94a264f6"),
                        "Id": 1,
                        "p0": 1,
                        "p1": true,
                        "p9": 9,
                        "p10": 10,
                        "p14@odata.mediaReadLink": "http://localhost/Meta(MongoId='5968aad95eb7eb3a94a264f6',Id=1,p9=9,p10=10)/p14",
                        "p14@odata.mediaContentType": "test",
                        "p47@odata.mediaReadLink": "http://localhost/Meta(MongoId='5968aad95eb7eb3a94a264f6',Id=1,p9=9,p10=10)/p47",
                        "p66@odata.mediaReadLink": "http://localhost/Meta(MongoId='5968aad95eb7eb3a94a264f6',Id=1,p9=9,p10=10)/p66"
                    }
                ]
            },
            elementType: BaseMeta,
            contentType: "application/json"
        });

        // createTest("should create BaseMeta entity", MetaTestServer, "POST /Meta", {
        //     statusCode: 204
        // }, { 
        //     Id : 2, 
        //     p0 : 2, 
        //     p1 : false, 
        //     p9 : 29, 
        //     p10 : 30, 
        //     MongoId : new ObjectID('5968aad95eb7eb3a94a264f6')
        //     // "@odata.type" : Meta
        // });

        createTest("should return Meta result by keys", MetaTestServer, "GET /Meta(Id=1,MongoId='578f2b8c12eaebabec4af242',p9=9,p10=10)", {
            statusCode: 200,
            body: {
                "@odata.type": "#Meta.Meta",
                "@odata.context": "http://localhost/$metadata#Meta/$entity",
                "@odata.id": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)",
                "b0": "b0",
                "Id": 1,
                "p9": 9,
                "p10": 10,
                "p14@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p14",
                "p14@odata.mediaContentType": "test",
                "p47@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p47",
                "p66@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p66",
                MongoId: new ObjectID("578f2b8c12eaebabec4af242")
            },
            elementType: Meta,
            contentType: "application/json"
        });
    });

    describe("Expand", () => {
        createTest("should return expanded Meta result with media", MetaTestServer, "GET /Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)?$expand=Meta.Meta/MediaList", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Meta/$entity",
                "@odata.id": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)",
                "@odata.type": "#Meta.Meta",
                "MongoId": new ObjectID("578f2b8c12eaebabec4af242"),
                "b0": "b0",
                "Id": 1,
                "p9": 9,
                "p10": 10,
                "p14@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p14",
                "p14@odata.mediaContentType": "test",
                "p47@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p47",
                "p66@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p66",
                "MediaList": [
                    {
                        "@odata.id": "http://localhost/Media(Id=1,StringId='two')",
                        "@odata.mediaReadLink": "http://localhost/Media(Id=1,StringId='two')/$value",
                        "@odata.mediaContentType": "audio/mp3",
                        "Id": 1,
                        "StringId": "two"
                    }
                ]
            },
            elementType: Meta,
            contentType: "application/json"
        });

        createTest("should return expanded Meta result with the filtered media", MetaTestServer, "GET /Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)?$expand=Meta.Meta/MediaList($filter=Id eq 1)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Meta/$entity",
                "@odata.id": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)",
                "@odata.type": "#Meta.Meta",
                "MongoId": new ObjectID("578f2b8c12eaebabec4af242"),
                "b0": "b0",
                "Id": 1,
                "p9": 9,
                "p10": 10,
                "p14@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p14",
                "p14@odata.mediaContentType": "test",
                "p47@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p47",
                "p66@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p66",
                "MediaList": [
                    {
                        "@odata.id": "http://localhost/Media(Id=1,StringId='two')",
                        "@odata.mediaReadLink": "http://localhost/Media(Id=1,StringId='two')/$value",
                        "@odata.mediaContentType": "audio/mp3",
                        "Id": 1,
                        "StringId": "two"
                    }
                ]
            },
            elementType: Meta,
            contentType: "application/json"
        });

        createTest("should return expanded Meta result with the filtered media", MetaTestServer, "GET /Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)?$expand=Meta.Meta/MediaList($top=1)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Meta/$entity",
                "@odata.id": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)",
                "@odata.type": "#Meta.Meta",
                "MongoId": new ObjectID("578f2b8c12eaebabec4af242"),
                "b0": "b0",
                "Id": 1,
                "p9": 9,
                "p10": 10,
                "p14@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p14",
                "p14@odata.mediaContentType": "test",
                "p47@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p47",
                "p66@odata.mediaReadLink": "http://localhost/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p66",
                "MediaList": [
                    {
                        "@odata.id": "http://localhost/Media(Id=1,StringId='two')",
                        "@odata.mediaReadLink": "http://localhost/Media(Id=1,StringId='two')/$value",
                        "@odata.mediaContentType": "audio/mp3",
                        "Id": 1,
                        "StringId": "two"
                    }
                ]
            },
            elementType: Meta,
            contentType: "application/json"
        });
    });

    describe("Test entity", () => {
        createTest("should return test entity result", MetaTestServer, "GET /TestEntity", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#TestEntity",
                "value": [
                    {
                        "@odata.id": "http://localhost/TestEntity(1)",
                        "Genre": "Server.Genre2'0'",
                        "test": 1
                    }
                ]
            },
            elementType: TestEntity,
            contentType: "application/json"
        });

        createTest("should return test entity result by id", MetaTestServer, "GET /TestEntity(15)", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#TestEntity/$entity",
                "value": [
                    {
                        "@odata.id": "http://localhost/TestEntity(1)",
                        "Genre": "Server.Genre2'0'",
                        "test": 1
                    }
                ]
            },
            elementType: TestEntity,
            contentType: "application/json"
        });

        createTest("should create a test entity with base controller insert method", MetaTestServer, "POST /TestEntity", {
            statusCode: 201,
            body: {
                "@odata.context": "http://localhost/$metadata#TestEntity/$entity",
                "@odata.id": "http://localhost/TestEntity(99)",
                "Genre": "Server.Genre2'0'",
                "test": 99
            },
            elementType: TestEntity,
            contentType: "application/json"
        },
        {
            test: 99
        });
    });

    describe("Empty entity", () => {
        createTest("should return empty entity result count", MetaTestServer, "GET /EmptyEntity/$count", {
            statusCode: 200,
            body: 1,
            elementType: Number,
            contentType: "text/plain"
        });

        createTest("should return empty array count", MetaTestServer, "GET /EmptyEntity2/$count", {
            statusCode: 200,
            body: 0,
            contentType: "text/plain"
        });

        createTest("try to return string result count", MetaTestServer, "GET /EmptyEntity3/$count", {
            statusCode: 200,
            body: 4,
            elementType: Number,
            contentType: "text/plain"
        });

        // createTest("try to return empty string result count", MetaTestServer, "GET /EmptyEntity4/$count", {
        //     statusCode: 200,
        //     body: 0,
        //     contentType: "text/plain"
        // });

        createTest("try to return boolean result count", MetaTestServer, "GET /EmptyEntity5/$count", {
            statusCode: 200,
            body: 0,
            contentType: "text/plain"
        });

        createTest("try to return number result count", MetaTestServer, "GET /EmptyEntity6/$count", {
            statusCode: 200,
            body: 0,
            contentType: "text/plain"
        });
    });

    describe("FunctionImport", () => {
        const objId = new ObjectID('578f2b8c12eaebabec4af288')
        createTest("shuld return objectId to hex string", MetaTestServer, `GET /ObjId(v='${objId}')`, {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Server.ObjectID",
                "value": "578f2b8c12eaebabec4af288"
            },
            elementType: ObjectID,
            contentType: "application/json"
        });
    });

    describe("Create server, controller, model with .define() method", () => {
        createTest("shuld return DefTest result", DefTestServer, `GET /DefTest`, {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#DefTest",
                "value": [
                    {
                        "@odata.id": "http://localhost/DefTest(1)",
                        "id": 1,
                        "key": "testkey",
                        "value": "testvalue"
                    }
                ]
            },
            elementType: DefTest,
            contentType: "application/json"
        });

        createTest("shuld return DefTest result by key", DefTestServer, `GET /DefTest(11)`, {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#DefTest/$entity",
                "@odata.id": "http://localhost/DefTest(11)",
                "id": 11,
                "key": "testkey11",
                "value": "testvalue11"
            },
            elementType: DefTest,
            contentType: "application/json"
        });
    });

}