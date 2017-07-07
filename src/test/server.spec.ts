/// <reference types="mocha" />
import { TestServer, Foobar, NoServer, AuthenticationServer, Image, User, Location, Music } from './test.model';
import { Token } from "odata-v4-parser/lib/lexer";
import { createFilter } from "odata-v4-inmemory";
import { ODataController, ODataServer, ODataProcessor, ODataMethodType, ODataResult, Edm, odata, ODataHttpContext, ODataStream } from "../lib/index";
import { Product, Category } from "../example/model";
import { Readable, PassThrough, Writable } from "stream";
import { ObjectID } from "mongodb";
const { expect } = require("chai");
const extend = require("extend");
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");

export function testFactory(createTest: Function) {
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

        it("should update foobar's foo property ", () => {
            return TestServer.execute("/EntitySet(1)/foo", "PUT", {
                foo: "PUT"
            }).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });

                return TestServer.execute("/EntitySet(1)", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: {
                            "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                            "@odata.id": "http://localhost/EntitySet(1)",
                            "@odata.editLink": "http://localhost/EntitySet(1)",
                            id: 1,
                            foo: "PUT"
                        },
                        elementType: Foobar,
                        contentType: "application/json"
                    });
                });
            });
        });

        it("should delta update foobar's foo property ", () => {
            return TestServer.execute("/EntitySet(1)/foo", "PATCH", {
                foo: "PATCH"
            }).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });

                return TestServer.execute("/EntitySet(1)", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: {
                            "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                            "@odata.id": "http://localhost/EntitySet(1)",
                            "@odata.editLink": "http://localhost/EntitySet(1)",
                            id: 1,
                            foo: "PATCH"
                        },
                        elementType: Foobar,
                        contentType: "application/json"
                    });
                });
            });
        });

        it("should delete foobar's foo property ", () => {
            return TestServer.execute("/EntitySet(1)/foo", "DELETE").then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });

                return TestServer.execute("/EntitySet(1)", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: {
                            "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                            "@odata.id": "http://localhost/EntitySet(1)",
                            "@odata.editLink": "http://localhost/EntitySet(1)",
                            id: 1,
                            foo: null
                        },
                        elementType: Foobar,
                        contentType: "application/json"
                    });
                });
            });
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

        createTest("should return entity collection navigation property result", TestServer, "GET /Categories('578f2baa12eaebabec4af289')/Products", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Categories('578f2baa12eaebabec4af289')/Products",
                value: products.filter(product => product.CategoryId.toString() == "578f2baa12eaebabec4af289").map(product => Object.assign({
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
                value: products.filter(product => product.CategoryId.toString() == "578f2baa12eaebabec4af289" && product.Name == "Chai").map(product => Object.assign({
                    "@odata.id": "http://localhost/Products('578f2b8c12eaebabec4af23c')"
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

        it("should create product reference on category", () => {
            return TestServer.execute("/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref", "POST").then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
                return TestServer.execute("/Products('578f2b8c12eaebabec4af242')/Category", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: extend({
                            "@odata.context": "http://localhost/$metadata#Categories/$entity"
                        }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af28e").map(category => extend({
                            "@odata.id": `http://localhost/Categories('${category._id}')`
                        }, category))[0]
                        ),
                        elementType: Category,
                        contentType: "application/json"
                    })
                });
            });
        });

        it("should update product reference on category", () => {
            return TestServer.execute("/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref", "PUT").then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
                return TestServer.execute("/Products('578f2b8c12eaebabec4af242')/Category", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: extend({
                            "@odata.context": "http://localhost/$metadata#Categories/$entity"
                        }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af28e").map(category => extend({
                            "@odata.id": `http://localhost/Categories('${category._id}')`
                        }, category))[0]
                        ),
                        elementType: Category,
                        contentType: "application/json"
                    })
                });
            });
        });

        it("should delta update product reference on category", () => {
            return TestServer.execute("/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref", "PATCH").then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
                return TestServer.execute("/Products('578f2b8c12eaebabec4af242')/Category", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: extend({
                            "@odata.context": "http://localhost/$metadata#Categories/$entity"
                        }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af28e").map(category => extend({
                            "@odata.id": `http://localhost/Categories('${category._id}')`
                        }, category))[0]
                        ),
                        elementType: Category,
                        contentType: "application/json"
                    })
                });
            });
        });

        it("should delete product reference on category", () => {
            return TestServer.execute("/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref", "DELETE").then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
                return TestServer.execute("/Products('578f2b8c12eaebabec4af242')/Category", "GET").then((result) => {
                    throw new Error("Category reference should be deleted.");
                }, (err) => {
                    expect(err.name).to.equal("ResourceNotFoundError");
                });;
            });
        });

        it("should delete product reference on category by ref id", () => {
            return TestServer.execute("/Categories('578f2baa12eaebabec4af289')/Products/$ref?$id=http://localhost/Products('578f2b8c12eaebabec4af27e')", "DELETE").then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });

                return TestServer.execute("/Products('578f2b8c12eaebabec4af27e')/Category", "GET").then((result) => {
                    throw new Error("Category reference should be deleted.");
                }, (err) => {
                    expect(err.name).to.equal("ResourceNotFoundError");
                });
            });
        });

        it("should create category reference on product", () => {
            return TestServer.execute("/Products('578f2b8c12eaebabec4af286')/Category/$ref", "POST", {
                "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af28c')"
            }).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
                return TestServer.execute("/Products('578f2b8c12eaebabec4af286')/Category", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: extend({
                            "@odata.context": "http://localhost/$metadata#Categories/$entity"
                        }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af28c").map(category => extend({
                            "@odata.id": `http://localhost/Categories('${category._id}')`
                        }, category))[0]
                        ),
                        elementType: Category,
                        contentType: "application/json"
                    })
                });
            });
        });

        it("should update category reference on product", () => {
            return TestServer.execute("/Products('578f2b8c12eaebabec4af286')/Category/$ref", "PUT", {
                "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af28c')"
            }).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
                return TestServer.execute("/Products('578f2b8c12eaebabec4af286')/Category", "GET").then((result) => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: extend({
                            "@odata.context": "http://localhost/$metadata#Categories/$entity"
                        }, categories.filter(category => category._id.toString() == "578f2baa12eaebabec4af28c").map(category => extend({
                            "@odata.id": `http://localhost/Categories('${category._id}')`
                        }, category))[0]
                        ),
                        elementType: Category,
                        contentType: "application/json"
                    })
                });
            });
        });

        it("should delete category reference on product", () => {
            return TestServer.execute("/Products('578f2b8c12eaebabec4af288')/Category/$ref", "DELETE", {
                "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af28e')"
            }).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });

                return TestServer.execute("/Products('578f2b8c12eaebabec4af288')/Category", "GET").then((result) => {
                    throw new Error("Category reference should be deleted.");
                }, (err) => {
                    expect(err.name).to.equal("ResourceNotFoundError");
                });
            });
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
                "Data@odata.mediaContentType": "image/png"
            },
            elementType: Image,
            contentType: "application/json"
        });

        it("stream property POST", () => {
            let readableStrBuffer = new streamBuffers.ReadableStreamBuffer();
            readableStrBuffer.put('tmp.png');
            return TestServer.execute("/ImagesControllerEntitySet(1)/Data", "POST", readableStrBuffer).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
            });
        });

        createTest("stream property write and pipe", TestServer, "GET /ImagesControllerEntitySet(1)/Data2", {
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#ImagesControllerEntitySet(1)/Data2",
                value: [
                    {
                        value: 0
                    }
                ]
            },
            elementType: "Edm.Stream",
            contentType: "application/json"
        });
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

        it("media entity POST", () => {
            let readableStrBuffer = new streamBuffers.ReadableStreamBuffer();
            readableStrBuffer.put('tmp.mp3');
            return TestServer.execute("/MusicControllerEntitySet(1)/$value", "POST", readableStrBuffer).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
            });
        });
    });
}