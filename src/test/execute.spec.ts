/// <reference types="mocha" />
import { TestServer, Foobar } from './test.model';
import { ODataServer } from "../lib/index";
import { testFactory } from './server.spec'
import { Product, Category } from "../example/model";
const { expect } = require("chai");
const extend = require("extend");
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");

function createTest(testcase: string, server: typeof ODataServer, command: string, compare: any, body?: any) {
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        return server.execute(test.slice(1).join(" "), test[0], body).then((result) => {
            expect(result).to.deep.equal(compare);
        });
    });
}

describe("Odata execute", () => {
    testFactory(createTest);

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

    it("should delta update foobar's foo property ", () => {
        return TestServer.execute("/EntitySet(1)/foo", "PATCH", {
            foo: "bar"
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
                        foo: "bar"
                    },
                    elementType: Foobar,
                    contentType: "application/json"
                });
            });
        });
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
        return TestServer.execute("/Categories('578f2baa12eaebabec4af28b')/Products/$ref?$id=http://localhost/Products('578f2b8c12eaebabec4af284')", "DELETE").then((result) => {
            expect(result).to.deep.equal({
                statusCode: 204
            });

            return TestServer.execute("/Products('578f2b8c12eaebabec4af284')/Category", "GET").then((result) => {
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

    describe("Stream properties", () => {
        it("stream property POST", () => {
            let readableStrBuffer = new streamBuffers.ReadableStreamBuffer();
            readableStrBuffer.put('tmp.png');
            return TestServer.execute("/ImagesControllerEntitySet(1)/Data", "POST", readableStrBuffer).then((result) => {
                expect(result).to.deep.equal({
                    statusCode: 204
                });
            });
        });
    });

    describe("Media entity", () => {
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
})
