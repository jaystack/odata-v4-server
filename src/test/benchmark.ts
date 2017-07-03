import * as Benchmark from "benchmark";
import { createFilter as inmemory } from "odata-v4-inmemory";
import { createFilter as mongodb } from "odata-v4-mongodb";
import { ODataServer, ODataController, ODataQuery, odata } from "../lib/index";

let data = [];
let suite = new Benchmark.Suite();

class InMemoryController extends ODataController{
    @odata.GET
    find(@odata.filter filter:ODataQuery){
        inmemory(filter);
        return data;
    }
}

class MongoDBController extends ODataController{
    @odata.GET
    find(@odata.filter filter:ODataQuery){
        mongodb(filter);
        return data;
    }
}

@odata.controller(InMemoryController, true)
@odata.controller(MongoDBController, true)
class BenchmarkServer extends ODataServer{}

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