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
const es = require("event-stream");
const index_1 = require("../lib/index");
class TestController extends index_1.ODataController {
    find() {
        return [{
                a: 1
            }, {
                b: 2
            }, {
                t: Date.now()
            }];
    }
    findOne(key) {
        return {
            id: key,
            t: Date.now()
        };
    }
}
__decorate([
    index_1.odata.GET
], TestController.prototype, "find", null);
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.key)
], TestController.prototype, "findOne", null);
let TestServer = class TestServer extends index_1.ODataServer {
};
TestServer = __decorate([
    index_1.odata.controller(TestController, true)
], TestServer);
exports.TestServer = TestServer;
TestServer.execute("/Test/$count", "GET").then((result) => {
    console.log(result);
});
let server = new TestServer();
server.pipe(es.mapSync(data => console.log(data)));
setInterval(() => {
    server.write({
        url: "/Test(" + Math.floor(Math.random() * 1000) + ")",
        method: "GET"
    });
}, 1000);
//# sourceMappingURL=test.js.map