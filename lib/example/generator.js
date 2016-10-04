"use strict";
const provider_1 = require("../provider");
const mongodb_1 = require("mongodb");
class ODataResult {
    constructor(data) {
        this.data = data;
    }
}
function* findGen() {
    let provider = new provider_1.MongoDBProvider({
        uri: "mongodb://localhost:27017/odataserver"
    });
    let collection = yield provider.storage("Products");
    let cursor = collection.find({ CategoryId: new mongodb_1.ObjectID("578f2baa12eaebabec4af289") });
    let inlinecount = cursor.count(false);
    let result = yield cursor.next();
    while (result) {
        yield result;
        result = yield cursor.next();
    }
    provider.close();
    yield new Promise(resolve => setTimeout(resolve, 3000));
    return inlinecount;
}
function isIterator(value) {
    return value instanceof (function* () { }).constructor;
}
function isPromise(value) {
    return value && typeof value.then == "function";
}
function run(iterator, options) {
    let start = Date.now();
    function id(x) { return x; }
    function iterate(value) {
        var next = iterator.next(value);
        console.log((Date.now() - start) + "ms");
        var request = next.value;
        var nextAction = next.done ? id : iterate;
        if (isPromise(request)) {
            return request.then(nextAction);
        }
        console.log(request);
        return nextAction(request);
    }
    return iterate();
}
run(findGen()).then((final) => {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!", final);
});
//# sourceMappingURL=generator.js.map