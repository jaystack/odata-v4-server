/// <reference types="mocha" />
import { TestServer, Foobar, NoServer, AuthenticationServer, Image, User, Location, Music  } from './test.model';
import { Token } from "odata-v4-parser/lib/lexer";
import { createFilter } from "odata-v4-inmemory";
import { ODataController, ODataServer, ODataProcessor, ODataMethodType, ODataResult, Edm, odata, ODataHttpContext, ODataStream } from "../lib/index";
import { Product, Category } from "../example/model";
import { Readable, PassThrough, Writable } from "stream";
import { ObjectID } from "mongodb";
import { testFactory } from './server.spec'
const { expect } = require("chai");
const extend = require("extend");
const request = require('request')
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");

// function createTest(testcase:string, server:typeof ODataServer, command:string, compare:any, body?:any){
//     it(`${testcase} (${command})`, () => {
//         let test = command.split(" ");
//         return server.execute(test.slice(1).join(" "), test[0], body).then((result) => {
//             expect(result).to.deep.equal(compare);
//         });
//     });
// }

describe("Code coverage", () => {
    it("should return empty object when no public controllers on server", () => {
        expect(odata.getPublicControllers(NoServer)).to.deep.equal({});
    });

    it("should not allow non-OData methods", () => {
        try {
            NoServer.execute("/dev/null", "MERGE");
            throw new Error("MERGE should not be allowed");
        } catch (err) {
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