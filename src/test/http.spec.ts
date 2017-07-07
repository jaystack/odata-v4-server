/// <reference types="mocha" />
import { TestServer, Foobar, NoServer, AuthenticationServer, Image, User, Location, Music  } from './test.model';
import { Token } from "odata-v4-parser/lib/lexer";
import { createFilter } from "odata-v4-inmemory";
import { ODataController, ODataServer, ODataProcessor, ODataMethodType, ODataResult, Edm, odata, ODataHttpContext, ODataStream } from "../lib/index";
import { Product, Category } from "../example/model";
import { Readable, PassThrough, Writable } from "stream";
import { ObjectID } from "mongodb";
import { testFactory } from './server.spec'
import * as request  from 'request'
const { expect } = require("chai");
const extend = require("extend");
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");

function createTest(testcase: string, server: typeof ODataServer, command: string, compare: any, body?: any) {
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        let method = test[0].toLowerCase();
        let path = test.slice(1).join(" ");
        let port = 3000;
        server.create(port);
        request[method](`http://localhost:${port}${path}`, body, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal(compare);
        })
    });
}

describe("Odata http", () =>{
    testFactory(createTest);
})
