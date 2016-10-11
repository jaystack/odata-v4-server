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
require("mocha");
const chai_1 = require("chai");
const index_1 = require("../lib/index");
class TestController1 extends index_1.ODataController {
    entitySet() {
        return [{ a: 1 }];
    }
    entity(key) {
        return { id: key };
    }
}
__decorate([
    index_1.odata.GET
], TestController1.prototype, "entitySet", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], TestController1.prototype, "entity", null);
class TestController2 extends index_1.ODataController {
    *entitySet() {
        return [{ a: 1 }];
    }
}
__decorate([
    index_1.odata.GET
], TestController2.prototype, "entitySet", null);
let TestServer = class TestServer extends index_1.ODataServer {
};
TestServer = __decorate([
    index_1.odata.controller(TestController1, "EntitySet"),
    index_1.odata.controller(TestController2, "EntitySet2")
], TestServer);
function createTest(testcase, server, command, compare, body) {
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        return server.execute(test[1], test[0]).then((result) => {
            chai_1.expect(JSON.stringify(result)).to.equal(JSON.stringify(compare));
        });
    });
}
describe("ODataServer", () => {
    createTest("should return entity set result", TestServer, "GET /EntitySet", {
        statusCode: 200,
        body: {
            "@odata.context": "http://localhost/$metadata#EntitySet",
            value: [{ a: 1 }]
        },
        contentType: "application/json"
    });
    createTest("should return entity set result using generator function", TestServer, "GET /EntitySet2", {
        statusCode: 200,
        body: {
            "@odata.context": "http://localhost/$metadata#EntitySet2",
            value: [{ a: 1 }]
        },
        contentType: "application/json"
    });
    createTest("should return entity by key", TestServer, "GET /EntitySet(1)", {
        statusCode: 200,
        body: {
            "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
            id: 1
        },
        contentType: "application/json"
    });
});
//# sourceMappingURL=server.spec.js.map