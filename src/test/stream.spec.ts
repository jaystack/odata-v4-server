/// <reference types="mocha" />
import { TestServer, Foobar, AuthenticationServer, Image, User, Location, Music } from './test.model';
import { Product, Category } from "../example/model";
import { ODataServer } from "../lib/index";
import { testFactory } from './server.spec'
const { expect } = require("chai");
const extend = require("extend");
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");

function createTest(testcase: string, server: typeof ODataServer, command: string, compare: any, body?: any) {
    let test = command.split(" ");
    let method = test[0].toLowerCase();
    let path = test.slice(1).join(" ");
    let testServer = new server();
    it(`${testcase} (${command})`, () => {

        let context: any = {};
        context.url = path;
        context.method = method;
        context.body = body;

        return new Promise((resolve, reject) => {
            testServer.write(context);
            testServer.on("data", data => { resolve(data) })
            testServer.on("error", err => { reject(err) })
        }).then(result => {
            expect(result).to.deep.equal(compare);
        })
    });
}

// TestServer.create(5005);

if (typeof describe == "function") {
    describe("Odata stream", () => {
        testFactory(createTest);
    });

    describe("Root stream", () => {
        let testServer = new TestServer();

        it("should update foobar's foo property", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = '/EntitySet(1)/foo';
                context.method = 'PUT';
                context.body = { foo: "PUT" };
                
                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = '/EntitySet(1)';
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
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
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should delete foobar's foo property", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = '/EntitySet(1)/foo';
                context.method = 'DELETE';
                
                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = '/EntitySet(1)';
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: {
                            "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                            "@odata.id": "http://localhost/EntitySet(1)",
                            "@odata.editLink": "http://localhost/EntitySet(1)",
                            "id": 1,
                            "foo": null
                        },
                        elementType: Foobar,
                        contentType: "application/json"
                    });
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should delta update foobar's foo property", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = '/EntitySet(1)/foo';
                context.method = 'PATCH';
                context.body = { foo: "bar" };
                
                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = '/EntitySet(1)';
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: {
                            "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
                            "@odata.id": "http://localhost/EntitySet(1)",
                            "@odata.editLink": "http://localhost/EntitySet(1)",
                            "id": 1,
                            "foo": "bar"
                        },
                        elementType: Foobar,
                        contentType: "application/json"
                    });
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should create product reference on category", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = `/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`;
                context.method = 'POST';
                
                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = `/Products('578f2b8c12eaebabec4af242')/Category`;
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: extend({
                                "@odata.context": "http://localhost/$metadata#Categories/$entity"
                            }, categories.filter(category => category._id.toString() == '578f2baa12eaebabec4af28e').map(category => extend({
                                "@odata.id": `http://localhost/Categories('${category._id}')`
                            }, category))[0]
                        ),
                        elementType: Category,
                        contentType: "application/json"
                    });
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should update product reference on category", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = `/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`;
                context.method = 'PUT';

                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = `/Products('578f2b8c12eaebabec4af242')/Category`;
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
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
                    });
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should delta update product reference on category", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = `/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`;
                context.method = 'PATCH';

                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = `/Products('578f2b8c12eaebabec4af242')/Category`;
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
                    expect(result).to.deep.equal({
                        statusCode: 200,
                        body: extend({
                                "@odata.context": "http://localhost/$metadata#Categories/$entity"
                            }, categories.filter(category => category._id.toString() == '578f2baa12eaebabec4af28e').map(category => extend({
                                "@odata.id": `http://localhost/Categories('${category._id}')`
                            }, category))[0]
                        ),
                        elementType: Category,
                        contentType: "application/json"
                    });
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should delete product reference on category", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = `/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`;
                context.method = 'DELETE';

                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = `/Products('578f2b8c12eaebabec4af242')/Category`;
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then((result) => { 
                    throw new Error("Category reference should be deleted.");
                })
                .catch((error) => {
                    expect(error.name).to.equal("ResourceNotFoundError");
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should delete product reference on category by ref id", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = `/Categories('578f2baa12eaebabec4af28b')/Products/$ref?$id=http://localhost/Products('578f2b8c12eaebabec4af284')`;
                context.method = 'DELETE';

                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = `/Products('578f2b8c12eaebabec4af284')/Category`;
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then((result) => { 
                    throw new Error("Category reference should be deleted.");
                })
                .catch((error) => {
                    expect(error.name).to.equal("ResourceNotFoundError");
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should create product reference on category", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = `/Products('578f2b8c12eaebabec4af286')/Category/$ref`;
                context.method = 'POST';
                context.body = {
                    "@odata.id": "http://localhost/Categories(categoryId='578f2baa12eaebabec4af28c')"
                }
                
                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = `/Products('578f2b8c12eaebabec4af286')/Category`;
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
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
                    });
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })

        it("should update category reference on product", () => {
            return new Promise((resolve, reject) => {
                let context: any = {};
                context.url = `/Products('578f2b8c12eaebabec4af286')/Category/$ref`;
                context.method = 'PUT';
                context.body = {
                    "@odata.id": "http://localhost/Categories(categoryId='578f2baa12eaebabec4af28c')"
                }
                
                testServer.write(context);
                testServer.on("data", data => { resolve(data) })
                testServer.on("error", err => { reject(err) })
            })
            .then(result => {
                expect(result).to.deep.equal({ statusCode: 204 });

                return new Promise((resolve, reject) => {
                    let context: any = {};
                    context.url = `/Products('578f2b8c12eaebabec4af286')/Category`;
                    context.method = 'GET';

                    testServer.write(context);
                    testServer.on("data", data => { resolve(data) })
                    testServer.on("error", err => { reject(err) })
                })
                .then(result => {
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
                    });
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        })
    });
}