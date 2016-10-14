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
const Benchmark = require("benchmark");
const odata_v4_inmemory_1 = require("odata-v4-inmemory");
const odata_v4_mongodb_1 = require("odata-v4-mongodb");
const index_1 = require("../lib/index");
let data = [];
let suite = new Benchmark.Suite();
class InMemoryController extends index_1.ODataController {
    find(filter) {
        let filterFn = odata_v4_inmemory_1.createFilter(filter);
        return data;
    }
}
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.filter)
], InMemoryController.prototype, "find", null);
class MongoDBController extends index_1.ODataController {
    find(filter) {
        let query = odata_v4_mongodb_1.createFilter(filter);
        return data;
    }
}
__decorate([
    index_1.odata.GET,
    __param(0, index_1.odata.filter)
], MongoDBController.prototype, "find", null);
let BenchmarkServer = class BenchmarkServer extends index_1.ODataServer {
};
BenchmarkServer = __decorate([
    index_1.odata.controller(InMemoryController, true),
    index_1.odata.controller(MongoDBController, true)
], BenchmarkServer);
console.log("Benchmarking...");
suite.add("InMemory#filter", {
    defer: true,
    fn: (defer) => {
        BenchmarkServer.execute("/InMemory?$filter=Title eq 'Title'", "GET").then(() => defer.resolve());
    }
}).add("MongoDB#filter", {
    defer: true,
    fn: (defer) => {
        BenchmarkServer.execute("/MongoDB?$filter=Title eq 'Title'", "GET").then(() => defer.resolve());
    }
}).on("cycle", (event) => {
    console.log(event.target.toString());
}).run();
//# sourceMappingURL=benchmark.js.map