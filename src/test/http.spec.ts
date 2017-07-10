/// <reference types="mocha" />
import { ODataServer, createODataServer } from "../lib/index";
import { testFactory } from './server.spec';
import { MetaTestServer } from './metadata.spec';
import { Foobar } from './test.model';
import { Product, Category } from "../example/model";
import * as request from 'request';

const extend = require("extend");
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");
const { expect } = require("chai");

function createTest(testcase: string, server: typeof ODataServer, command: string, compare: any, body?: any) {
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        let method = test[0].toLowerCase();
        let path = test.slice(1).join(" ");
        let port = 3000;
        server.create(port);
        return request[method](`http://localhost:${port}${path}`, body, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal(compare);
        })
    });
}

describe("Odata http", () => {
    testFactory(createTest);

    MetaTestServer.create(3002);
    it("should update foobar's foo property ", () => {
        return request.put(`http://localhost:3002/EntitySet(1)/foo`, { foo: "PUT" }, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });

            return request.get(`http://localhost:3002/EntitySet(1)`, (err, response, result) => {
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
        return request.delete(`http://localhost:3002/EntitySet(1)/foo`, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/EntitySet(1)`, (err, response, result) => {
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
        return request.patch(`http://localhost:3002/EntitySet(1)/foo`, { foo: 'bar' }, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/EntitySet(1)`, (err, response, result) => {
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
        return request.post(`http://localhost:3002/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err, response, result) => {
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
            });
        });
    });

    it("should update product reference on category", () => {
        return request.put(`http://localhost:3002/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err, response, result) => {
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
            });
        });
    });

    it("should delta update product reference on category", () => {
        return request.patch(`http://localhost:3002/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`, (err, request, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err, response, result) => {
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
            });
        });
    });

    it("should delete product reference on category", () => {
        return request.delete(`http://localhost:3002/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`, (err, request, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err) => {
                if (err) return expect(err.name).to.equal("ResourceNotFoundError");
                throw new Error("Category reference should be deleted.");
            });
        });
    });

    it("should delete product reference on category by ref id", () => {
        return request.delete(`http://localhost:3002/Categories('578f2baa12eaebabec4af28b')/Products/$ref?$id=http://localhost/Products('578f2b8c12eaebabec4af284')`, (err, request, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af284')/Category`, (err) => {
                if (err) return expect(err.name).to.equal("ResourceNotFoundError");
                throw new Error("Category reference should be deleted.");
            });
        });
    });

    it("should create category reference on product", () => {
        return request.post(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category/$ref`, { "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af28c')" }, (err, request, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err, response, result) => {
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
            });
        });
    });

    it("should update category reference on product", () => {
        return request.put(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category/$ref`, { "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af28c')" }, (err, request, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category`, (err, response, result) => {
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
            });
        });
    });

    it("should delete category reference on product", () => {
        return request.delete(`http://localhost:3002/Products('578f2b8c12eaebabec4af288')/Category/$ref`, { "@odata.id": "http://localhost/Categories('578f2baa12eaebabec4af28e')" }, (err, request, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal({ statusCode: 204 });
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af288')/Category`, (err) => {
                if (err) return expect(err.name).to.equal("ResourceNotFoundError");
                throw new Error("Category reference should be deleted.");
            });
        });
    });

    createODataServer(MetaTestServer, "/test", 3003);
    describe("Stream properties", () => {
        it("stream property POST", () => {
            let readableStrBuffer = new streamBuffers.ReadableStreamBuffer();
            readableStrBuffer.put('tmp.png');
            return request.post(`http://localhost:3003/test/ImagesControllerEntitySet(1)/Data`, readableStrBuffer, (err, response, result) => {
                if (err) { console.log(err); }
                expect(result).to.deep.equal({ statusCode: 204 });
            });
        });
    });

    describe("Media entity", () => {
        it("media entity POST", () => {
            let readableStrBuffer = new streamBuffers.ReadableStreamBuffer();
            readableStrBuffer.put('tmp.mp3');
            return request.post(`http://localhost:3003/test/MusicControllerEntitySet(1)/$value`, readableStrBuffer, (err, response, result) => {
                if (err) { console.log(err); }
                expect(result).to.deep.equal({ statusCode: 204 });
            });
        });
    });
});
