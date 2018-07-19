/// <reference types="mocha" />
import { ODataServer, createODataServer, NotImplementedError } from "../lib/index";
import { testFactory } from './server.spec';
import { MetaTestServer } from './metadata.spec';
import { TestServer, Foobar } from './test.model';
import { Product, Category } from "./model/model";
import { ObjectID } from "mongodb";
import * as request from 'request-promise';
import * as streamBuffers from "stream-buffers";
import * as fs from "fs";
import * as path from "path";

const extend = require("extend");
let categories = require("./model/categories");
let products = require("./model/products");
const { expect } = require("chai");

let serverCache = new WeakMap<typeof ODataServer, number>();
let serverCacheArray = [];
let serverPort = 5000;

if (typeof after == "function"){
    after(function(){
        serverCacheArray.forEach(server => server.close());
    });
}

function createTestFactory(it) {
    return function createTest(testcase: string, server: typeof ODataServer, command: string, compare: any, body?: any) {
        it(`${testcase} (${command})`, () => {
            let test = command.split(" ");
            let method = test[0].toLowerCase();
            let path = test.slice(1).join(" ");
            let port: number;
            if (!serverCache.has(server)) {
                port = serverPort++;
                const instance = server.create(port);
                serverCache.set(server, port);
                serverCacheArray.push(instance);
            } else {
                port = serverCache.get(server);
            }
            return new Promise((resolve, reject) => {
                request[method](`http://localhost:${port}${path}`, { json: body }, (err, response, result) => {
                    if (err) return reject(err);
                    try {
                        if (result) {
                            if (typeof result == "object") {
                                result = JSON.stringify(result);
                            }
                            try { result = result.replace(new RegExp(`http:\\/\\/localhost:${port}\\/`, 'gi'), 'http://localhost/'); } catch (err) { }
                            try { result = JSON.parse(result); } catch (err) { }
                        }
                        if (compare.body) {
                            if (typeof compare.body == "object") {
                                expect(result).to.deep.equal(JSON.parse(JSON.stringify(compare.body)));
                            } else {
                                expect(result).to.equal(compare.body);
                            }
                        }
                        if (compare.statusCode) {
                            expect(response.statusCode).to.equal(compare.statusCode);
                        }
                        if (compare.contentType) {
                            expect(response.headers["content-type"].indexOf(compare.contentType)).to.be.above(-1);
                        }
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        });
    };
}

const createTest: any = createTestFactory(it);
createTest.only = createTestFactory(it.only);

describe("OData HTTP", () => {
    serverCacheArray.push(TestServer.create(3002));
    serverCache.set(TestServer, 3002);
    testFactory(createTest);

    serverCacheArray.push(MetaTestServer.create(3003, 'localhost'));
    serverCache.set(MetaTestServer, 3003);

    describe("accept header", () => {
        it("should return entityset result with 'application/json;odata.metadata=full' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'application/json;odata.metadata=full' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "@odata.type": "#Default.Foobar",
                        "a": 1,
                        "a@odata.type": "#Int16",
                        "id": 1,
                        "id@odata.type": "#Int32",
                    }]
                });
            });
        });

        it("should return entityset result with 'application/json;odata.metadata=none' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'application/json;odata.metadata=none' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    value: [{
                        "a": 1,
                        "id": 1
                    }]
                });
            });
        });

        it("should return entityset result with 'text/html;odata.metadata=full' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'text/html;odata.metadata=full' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "@odata.type": "#Default.Foobar",
                        "a": 1,
                        "a@odata.type": "#Int16",
                        "id": 1,
                        "id@odata.type": "#Int32",
                    }]
                });
            });
        });

        it("should return entityset result with 'text/html;odata.metadata=minimal' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'text/html;odata.metadata=minimal' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "a": 1,
                        "id": 1,
                    }]
                });
            });
        });

        it("should return entityset result with 'text/html;odata.metadata=none' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'text/html;odata.metadata=none' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    value: [{
                        "a": 1,
                        "id": 1
                    }]
                });
            });
        });

        it("should return entityset result with 'xml;odata.metadata=full' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'xml;odata.metadata=full' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "@odata.type": "#Default.Foobar",
                        "a": 1,
                        "a@odata.type": "#Int16",
                        "id": 1,
                        "id@odata.type": "#Int32",
                    }]
                });
            });
        });

        it("should return entityset result with 'xml;odata.metadata=minimal' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'xml;odata.metadata=minimal' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "a": 1,
                        "id": 1,
                    }]
                });
            });
        });

        it("should return entityset result with 'xml;odata.metadata=none' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: 'xml;odata.metadata=none' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    value: [{
                        "a": 1,
                        "id": 1
                    }]
                });
            });
        });

        it("should return entityset result with '*/*;odata.metadata=full' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: '*/*;odata.metadata=full' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "@odata.type": "#Default.Foobar",
                        "a": 1,
                        "a@odata.type": "#Int16",
                        "id": 1,
                        "id@odata.type": "#Int32",
                    }]
                });
            });
        });

        it("should return entityset result with '*/*;odata.metadata=minimal' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: '*/*;odata.metadata=minimal' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "a": 1,
                        "id": 1,
                    }]
                });
            });
        });

        it("should return entityset result with '*/*;odata.metadata=none' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: '*/*;odata.metadata=none' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    value: [{
                        "a": 1,
                        "id": 1
                    }]
                });
            });
        });

        it("should return entityset result with '*/*;odata.metadata=minimal;charset=utf-16' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: '*/*;odata.metadata=minimal;charset=utf-16' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet",
                    value: [{
                        "@odata.id": "http://localhost:3002/EntitySet(1)",
                        "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                        "a": 1,
                        "id": 1,
                    }]
                });
            });
        });

        it("should return entityset result with '*/*;odata.metadata=none;charset=utf-16' header", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { accept: '*/*;odata.metadata=none;charset=utf-16' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    value: [{
                        "a": 1,
                        "id": 1
                    }]
                });
            });
        });

        it("should create new foo element with 'application/json;odata.metadata=full' header", () => {
            return request.post(`http://localhost:3002/EntitySet`, { headers: { accept: 'application/json;odata.metadata=full' }, json: { id: 999, foo: "999" } }, (err, response, result) => {
                expect(response.statusCode).to.equal(201);
            }).then(_ => {
                return request.get(`http://localhost:3002/EntitySet(999)`, { headers: { accept: 'application/json;odata.metadata=none' } }, (err, response, result) => {
                    expect(JSON.parse(result)).to.deep.equal({
                        id: 999,
                        foo: "999"
                    });
                });
            });
        });

        it("should return expanded Meta with 'application/json;odata.metadata=full' header using $select", () => {
            return request.get(`http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)?$select=Id&$expand=Meta.Meta/MediaList`, { headers: { accept: 'application/json;odata.metadata=full' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3003/$metadata#Meta(Id)/$entity",
                    "@odata.id": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)",
                    "@odata.type": "#Meta.Meta",
                    "Id": 1,
                    "Id@odata.type": "#Int32",
                    "MediaList": [
                        {
                            "@odata.id": "http://localhost:3003/Media(Id=1,StringId='two')",
                            "@odata.mediaContentType": "audio/mp3",
                            "@odata.mediaReadLink": "http://localhost:3003/Media(Id=1,StringId='two')/$value",
                            "@odata.type": "#Media.Media",
                            "Id": 1,
                            "Id@odata.type": "#Int32",
                            "Meta@odata.associationLink": "http://localhost:3003/Media(Id=1,StringId='two')/Meta/$ref",
                            "Meta@odata.navigationLink": "http://localhost:3003/Media(Id=1,StringId='two')/Meta",
                            "StringId": "two"
                        }
                    ],
                    "MediaList@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/MediaList/$ref",
                    "MediaList@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/MediaList"
                });
            });
        });

        it("should return expanded Meta with 'application/json;odata.metadata=full' header", () => {
            return request.get(`http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)?$expand=Meta.Meta/MediaList`, { headers: { accept: 'application/json;odata.metadata=full' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3003/$metadata#Meta/$entity",
                    "@odata.id": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)",
                    "@odata.type": "#Meta.Meta",
                    "Color@odata.type": "#Color2",
                    "Complex@odata.type": "#Meta.Complex",
                    "ComplexList@odata.type": "#Collection(Meta.Complex)",
                    "Genre@odata.type": "#EnumSchema.Genre2",
                    "Genre": "EnumSchema.Genre2'0'",
                    "Id": 1,
                    "Id@odata.type": "#Int32",
                    "MediaList": [
                        {
                            "@odata.id": "http://localhost:3003/Media(Id=1,StringId='two')",
                            "@odata.mediaContentType": "audio/mp3",
                            "@odata.mediaReadLink": "http://localhost:3003/Media(Id=1,StringId='two')/$value",
                            "@odata.type": "#Media.Media",
                            "Id": 1,
                            "Id@odata.type": "#Int32",
                            "Meta@odata.associationLink": "http://localhost:3003/Media(Id=1,StringId='two')/Meta/$ref",
                            "Meta@odata.navigationLink": "http://localhost:3003/Media(Id=1,StringId='two')/Meta",
                            "StringId": "two"
                        }
                    ],
                    "MediaList@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/MediaList/$ref",
                    "MediaList@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/MediaList",
                    "MongoId": "578f2b8c12eaebabec4af242",
                    "MongoId@odata.type": "#Server.ObjectID2",
                    "b0": "b0",
                    "myType@odata.type": "#Server.MyType",
                    "p0@odata.type": "#Binary",
                    "p10": 10,
                    "p10@odata.type": "#Int32",
                    "p11@odata.type": "#Int64",
                    "p12@odata.type": "#SByte",
                    "p13@odata.type": "#Single",
                    "p14@odata.mediaContentType": "test",
                    "p14@odata.mediaReadLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p14",
                    "p14@odata.type": "#Stream",
                    "p16@odata.type": "#TimeOfDay",
                    "p17@odata.type": "#Geography",
                    "p18@odata.type": "#GeographyPoint",
                    "p19@odata.type": "#GeographyLineString",
                    "p20@odata.type": "#GeographyPolygon",
                    "p21@odata.type": "#GeographyMultiPoint",
                    "p22@odata.type": "#GeographyMultiLineString",
                    "p23@odata.type": "#GeographyMultiPolygon",
                    "p24@odata.type": "#GeographyCollection",
                    "p25@odata.type": "#Geometry",
                    "p26@odata.type": "#GeometryPoint",
                    "p27@odata.type": "#GeometryLineString",
                    "p28@odata.type": "#GeometryPolygon",
                    "p29@odata.type": "#GeometryMultiPoint",
                    "p2@odata.type": "#Byte",
                    "p30@odata.type": "#GeometryMultiLineString",
                    "p31@odata.type": "#GeometryMultiPolygon",
                    "p32@odata.type": "#GeometryCollection",
                    "p33@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p33/$ref",
                    "p33@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p33",
                    "p34@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p34/$ref",
                    "p34@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p34",
                    "p35@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p35/$ref",
                    "p35@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p35",
                    "p36@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p36/$ref",
                    "p36@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p36",
                    "p37@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p37/$ref",
                    "p37@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p37",
                    "p38@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p38/$ref",
                    "p38@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p38",
                    "p39@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p39/$ref",
                    "p39@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p39",
                    "p3@odata.type": "#Date",
                    "p40@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p40/$ref",
                    "p40@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p40",
                    "p41@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p41/$ref",
                    "p41@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p41",
                    "p42@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p42/$ref",
                    "p42@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p42",
                    "p43@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p43/$ref",
                    "p43@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p43",
                    "p44@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p44/$ref",
                    "p44@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p44",
                    "p45@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p45/$ref",
                    "p45@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p45",
                    "p46@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p46/$ref",
                    "p46@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p46",
                    "p47@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p47/$ref",
                    "p47@odata.mediaReadLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p47",
                    "p47@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p47",
                    "p48@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p48/$ref",
                    "p48@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p48",
                    "p49@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p49/$ref",
                    "p49@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p49",
                    "p4@odata.type": "#DateTimeOffset",
                    "p50@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p50/$ref",
                    "p50@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p50",
                    "p51@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p51/$ref",
                    "p51@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p51",
                    "p52@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p52/$ref",
                    "p52@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p52",
                    "p53@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p53/$ref",
                    "p53@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p53",
                    "p54@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p54/$ref",
                    "p54@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p54",
                    "p55@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p55/$ref",
                    "p55@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p55",
                    "p56@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p56/$ref",
                    "p56@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p56",
                    "p57@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p57/$ref",
                    "p57@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p57",
                    "p58@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p58/$ref",
                    "p58@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p58",
                    "p59@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p59/$ref",
                    "p59@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p59",
                    "p5@odata.type": "#Decimal",
                    "p60@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p60/$ref",
                    "p60@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p60",
                    "p61@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p61/$ref",
                    "p61@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p61",
                    "p62@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p62/$ref",
                    "p62@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p62",
                    "p63@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p63/$ref",
                    "p63@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p63",
                    "p64@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p64/$ref",
                    "p64@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p64",
                    "p65@odata.associationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p65/$ref",
                    "p65@odata.navigationLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p65",
                    "p66@odata.mediaReadLink": "http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)/p66",
                    "p66@odata.type": "#Stream",
                    "p6@odata.type": "#Double",
                    "p7@odata.type": "#Duration",
                    "p8@odata.type": "#Guid",
                    "p9": 9,
                    "p9@odata.type": "#Int16"
                });
            });
        });

        it("should return expanded Meta with 'application/json;odata.metadata=none' header", () => {
            return request.get(`http://localhost:3003/Meta(MongoId='578f2b8c12eaebabec4af242',Id=1,p9=9,p10=10)?$expand=Meta.Meta/MediaList`, { headers: { accept: 'application/json;odata.metadata=none' } }, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "Id": 1,
                    "MediaList": [
                        {
                            "Id": 1,
                            "StringId": "two"
                        }
                    ],
                    "Genre": "EnumSchema.Genre2'0'",
                    "MongoId": "578f2b8c12eaebabec4af242",
                    "b0": "b0",
                    "p10": 10,
                    "p9": 9,
                });
            });
        });

        it("should return error if the media type is unsupported", () => {
            return request.get(`http://localhost:3003/EntitySet`, { headers: { accept: 'text/plain;odata.metadata=none' } }, (err, response, result) => {
                expect(JSON.parse(result).error.message).to.equal("Unsupported media type.");
            }).catch(ex => {
                if (ex) expect(JSON.parse(ex.error).error.message).to.equal("Unsupported media type.");
            });
        });

        it("should return error if odata-maxversion less then 4.0", () => {
            return request.get(`http://localhost:3002/EntitySet`, { headers: { 'odata-maxversion': '3.0' ,accept: '*/*;odata.metadata=full' } }, (err, response, result) => {
                expect(JSON.parse(result).error.message).to.equal("Only OData version 4.0 supported");
            }).catch(ex => {
                if (ex) expect(JSON.parse(ex.error).error.message).to.equal("Only OData version 4.0 supported");
            });
        });

        it("set status code 403 in controller", () => {
            return request.get(`http://localhost:3002/HeaderTestEntity`, (err, response, result) => {
                expect(response.statusCode).to.equal(403);
            }).catch(ex => {
                if (ex) return expect(ex.statusCode).to.equal(403);
            });
        });

        it("set status code 500 in controller", () => {
            return request.get(`http://localhost:3002/HeaderTestEntity(2)`, (err, response, result) => {
                expect(response.statusCode).to.equal(500);
            }).catch(ex => {
                if (ex) return expect(ex.statusCode).to.equal(500);
            });
        });

        it("set status code 403 in FunctionImport", () => {
            return request.get(`http://localhost:3002/SetStatusCode()`, (err, response, result) => {
                expect(response.statusCode).to.equal(403);
            }).catch(ex => {
                if (ex) return expect(ex.statusCode).to.equal(403);
            });
        });

        it("set status code 500 in ActionImport", () => {
            return request.post(`http://localhost:3002/SetStatusCode2`, (err, response, result) => {
                expect(response.statusCode).to.equal(500);
            }).catch(ex => {
                if (ex) return expect(ex.statusCode).to.equal(500);
            });
        });
    });

    it("should update foobar's foo property ", () => {
        return request.put(`http://localhost:3002/EntitySet(1)/foo`, { json: { foo: "PUT" } }, (err, response, result) => {
            expect(response.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/EntitySet(1)`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet/$entity",
                    "@odata.id": "http://localhost:3002/EntitySet(1)",
                    "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                    id: 1,
                    foo: "PUT"
                });
            });
        });
    });

    it("should delete foobar's foo property ", () => {
        return request.delete(`http://localhost:3002/EntitySet(1)/foo`, (err, response, result) => {
            expect(response.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/EntitySet(1)`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet/$entity",
                    "@odata.id": "http://localhost:3002/EntitySet(1)",
                    "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                    id: 1,
                    foo: null
                });
            });
        });
    });

    it("should delta update foobar's foo property ", () => {
        return request.patch(`http://localhost:3002/EntitySet(1)/foo`, { json: { foo: 'bar' } }, (err, response, result) => {
            expect(response.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/EntitySet(1)`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet/$entity",
                    "@odata.id": "http://localhost:3002/EntitySet(1)",
                    "@odata.editLink": "http://localhost:3002/EntitySet(1)",
                    id: 1,
                    foo: "bar"
                });
            });
        });
    });

    it("should delete foobar's 'a' property with PATCH handler", () => {
        return request.delete(`http://localhost:3002/EntitySet(2)/a`, (err, response, result) => {
            expect(response.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/EntitySet(2)`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#EntitySet/$entity",
                    "@odata.id": "http://localhost:3002/EntitySet(2)",
                    "@odata.editLink": "http://localhost:3002/EntitySet(2)",
                    id: 2,
                    foo: 'bar',
                    a: null
                });
            });
        });
    });

    it("should create product reference on category", () => {
        return request.post(`http://localhost:3002/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`, (err, response, result) => {
            expect(response.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#Categories/$entity",
                    "@odata.id": "http://localhost:3002/Categories('578f2baa12eaebabec4af28e')",
                    "Description": "Sweet and savory sauces",
                    "Name": "Condiments",
                    "_id": "578f2baa12eaebabec4af28e"
                });
            });
        });
    });

    it("should delete product reference on category", () => {
        return request.delete(`http://localhost:3002/Categories('578f2baa12eaebabec4af28e')/Products('578f2b8c12eaebabec4af242')/$ref`, (err, req, result) => {
            expect(req.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err, req, result) => {
                if (err) return expect(err.name).to.equal("ResourceNotFoundError");
            }).catch(ex => {
                if (ex) return expect(ex.statusCode).to.equal(404);
            });
        });
    });

    it("should update product reference on category", () => {
        return request.put(`http://localhost:3002/Categories('578f2baa12eaebabec4af28d')/Products('578f2b8c12eaebabec4af242')/$ref`, (err, response, result) => {
            expect(response.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af242')/Category`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#Categories/$entity",
                    "@odata.id": "http://localhost:3002/Categories('578f2baa12eaebabec4af28d')",
                    "Description":"Seaweed and fish",
                    "Name":"Seafood",
                    "_id": "578f2baa12eaebabec4af28d"
                });
            });
        });
    });

    it("should delete product reference on category by ref id", () => {
        return request.delete(`http://localhost:3002/Categories('578f2baa12eaebabec4af28b')/Products/$ref?$id=http://localhost:3002/Products('578f2b8c12eaebabec4af284')`, (err, req, result) => {
            expect(req.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af284')/Category`, (err, req, result) => {
                if (err) return expect(err.name).to.equal("ResourceNotFoundError");
            }).catch(ex => {
                if (ex) return expect(ex.statusCode).to.equal(404);
            });
        });
    });

    it("should delta update product reference on category", () => {
        return request.patch(`http://localhost:3002/Categories('578f2baa12eaebabec4af28b')/Products('578f2b8c12eaebabec4af284')/$ref`, (err, req, result) => {
            expect(req.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af284')/Category`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#Categories/$entity",
                    "@odata.id": "http://localhost:3002/Categories('578f2baa12eaebabec4af28b')",
                    "Description":"Prepared meats",
                    "Name":"Meat/Poultry",
                    "_id": "578f2baa12eaebabec4af28b"
                });
            });
        });
    });

    it("should create category reference on product", () => {
        return request.post(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category/$ref`, { json: { "@odata.id": "http://localhost:3002/Categories(categoryId='578f2baa12eaebabec4af28c')" } }, (err, req, result) => {
            expect(req.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#Categories/$entity",
                    "@odata.id": "http://localhost:3002/Categories('578f2baa12eaebabec4af28c')",
                    "Description": "Dried fruit and bean curd",
                    "Name": "Produce",
                    "_id": "578f2baa12eaebabec4af28c"
                });
            });
        });
    });

    it("should delete category reference on product", () => {
        return request.delete(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category/$ref`, { json: { "@odata.id": "http://localhost:3002/Categories('578f2baa12eaebabec4af28c')" } }, (err, req, result) => {
            expect(req.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category`, (err) => {
                if (err) return expect(err.name).to.equal("ResourceNotFoundError");
            }).catch(ex => {
                if (ex) return expect(ex.statusCode).to.equal(404);
            });
        });
    });

    it("should update category reference on product", () => {
        return request.put(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category/$ref`, { json: { "@odata.id": "http://localhost:3002/Categories(categoryId='578f2baa12eaebabec4af289')" } }, (err, req, result) => {
            expect(req.statusCode).to.equal(204);
        }).then(_ => {
            return request.get(`http://localhost:3002/Products('578f2b8c12eaebabec4af286')/Category`, (err, response, result) => {
                expect(JSON.parse(result)).to.deep.equal({
                    "@odata.context": "http://localhost:3002/$metadata#Categories/$entity",
                    "@odata.id": "http://localhost:3002/Categories('578f2baa12eaebabec4af289')",
                    "Description":"Soft drinks",
                    "Name":"Beverages",
                    "_id": "578f2baa12eaebabec4af289"
                });
            });
        });
    });

    describe("Stream properties", () => {
        it("stream property POST", (done) => {
            let readableStrBuffer = new streamBuffers.ReadableStreamBuffer();
            let req = request.post(`http://localhost:3002/ImagesControllerEntitySet(1)/Data`);
            readableStrBuffer.pipe(req);
            readableStrBuffer.put('tmp.png');
            readableStrBuffer.stop();
            req.on('error', (err) => {
                done(err);
            });
            req.on('complete', (resp, body) => {
                expect(resp.statusCode).to.equal(204);
                done();
            });
        });

        it("stream property GET", (done) => {
            request.get(`http://localhost:3002/ImagesControllerEntitySet(1)/Data`, (err, resp, body) => {
                if (err) return done(err);
                expect(resp.statusCode).to.equal(200);
                expect(body).to.equal("tmp.png");
                done();
            });
        });

        it("stream property with ODataStream POST", (done) => {
            let req = request.post(`http://localhost:3002/ImagesControllerEntitySet(1)/Data2`);
            fs.createReadStream(path.join(__dirname, "fixtures", "logo_jaystack.png")).pipe(req);
            req.on('error', (err) => {
                done(err);
            });
            req.on('complete', (resp, body) => {
                expect(resp.statusCode).to.equal(204);
                expect(fs.readFileSync(path.join(__dirname, "fixtures", "logo_jaystack.png"))).to.deep.equal(fs.readFileSync(path.join(__dirname, "fixtures", "tmp.png")));
                if (fs.existsSync(path.join(__dirname, "fixtures", "tmp.png"))) {
                    fs.unlinkSync(path.join(__dirname, "fixtures", "tmp.png"));
                }
                done();
            });
        });

        it("stream property with ODataStream GET", (done) => {
            request.get(`http://localhost:3002/ImagesControllerEntitySet(1)/Data2`).on("response", resp => {
                expect(resp.statusCode).to.equal(200);
            }).on("error", done).pipe(fs.createWriteStream(path.join(__dirname, "fixtures", "tmp.png"))).on("finish", _ => {
                expect(fs.readFileSync(path.join(__dirname, "fixtures", "logo_jaystack.png"))).to.deep.equal(fs.readFileSync(path.join(__dirname, "fixtures", "tmp.png")));
                if (fs.existsSync(path.join(__dirname, "fixtures", "tmp.png"))) {
                    fs.unlinkSync(path.join(__dirname, "fixtures", "tmp.png"));
                }
                done();
            });
        });

        it("should return 204 after POST Data2 using generator function that yields stream", (done) => {
            let req = request.post(`http://localhost:3002/Images2ControllerEntitySet(1)/Data2`);
            fs.createReadStream(path.join(__dirname, "fixtures", "logo_jaystack.png")).pipe(req);
            req.on('error', (err) => {
                done(err);
            });
            req.on('complete', (resp, body) => {
                expect(resp.statusCode).to.equal(204);
                expect(fs.readFileSync(path.join(__dirname, "fixtures", "logo_jaystack.png"))).to.deep.equal(fs.readFileSync(path.join(__dirname, "fixtures", "tmp.png")));
                if (fs.existsSync(path.join(__dirname, "fixtures", "tmp.png"))) {
                    fs.unlinkSync(path.join(__dirname, "fixtures", "tmp.png"));
                }
                done();
            });
        });

        it("should return 200 after GET Data2 using generator function that yields stream", (done) => {
            request.get(`http://localhost:3002/Images2ControllerEntitySet(1)/Data2`).on("response", resp => {
                expect(resp.statusCode).to.equal(200);
            }).on("error", done).pipe(fs.createWriteStream(path.join(__dirname, "fixtures", "tmp.png"))).on("finish", _ => {
                expect(fs.readFileSync(path.join(__dirname, "fixtures", "logo_jaystack.png"))).to.deep.equal(fs.readFileSync(path.join(__dirname, "fixtures", "tmp.png")));
                if (fs.existsSync(path.join(__dirname, "fixtures", "tmp.png"))) {
                    fs.unlinkSync(path.join(__dirname, "fixtures", "tmp.png"));
                }
                done();
            });
        });
    });

    describe("Media entity", () => {
        it("media entity POST", (done) => {
            let readableStrBuffer = new streamBuffers.ReadableStreamBuffer();
            let req = request.post(`http://localhost:3002/MusicControllerEntitySet(1)/$value`);
            readableStrBuffer.pipe(req);
            readableStrBuffer.put('tmp.png');
            readableStrBuffer.stop();
            req.on('error', (err) => {
                done(err);
            });
            req.on('complete', (resp, body) => {
                expect(resp.statusCode).to.equal(204);
                done();
            });
        });
    });

    describe("Use query in service document", () => {
        it("shuld return 'Unsupported query' error", () => {
            return request.get(`http://localhost:3002/?$expand=Any`, (err, req, res) => {
                expect(JSON.parse(res).error.message).to.equal("Unsupported query");
            })
            .catch(ex => {
                expect(JSON.parse(ex.error).error.message).to.equal("Unsupported query");
            });
        });
    });

    describe("Not implemented error", () => {
        it("should return not implemented error", () => {
            return request.get(`http://localhost:3002/EntitySet`, () => {
                try {
                    throw new NotImplementedError();
                } catch (err) {
                    expect(err.message).to.equal("Not implemented.");
                }
            })
        });
    });

    describe("Non existent entity", () => {
        it("should return cannot read property node error", () => {
            return request.get(`http://localhost:3002/NonExistent`, (err, req, res) => {
                expect(JSON.parse(res).error.message).to.equal("Cannot read property 'node' of undefined");
            })
            .catch(ex => {
                expect(JSON.parse(ex.error).error.message).to.equal("Cannot read property 'node' of undefined");
            });
        });
    });
});
