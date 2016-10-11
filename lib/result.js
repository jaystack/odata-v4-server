"use strict";
const es6_promise_1 = require("es6-promise");
const extend = require("extend");
class ODataResult {
    constructor(statusCode, contentType, result) {
        this.statusCode = statusCode;
        if (result) {
            this.body = typeof result == "object" ? extend({}, result) : result;
            if (result && result.constructor)
                this.elementType = result.constructor;
            this.contentType = contentType || "application/json";
        }
    }
}
ODataResult.Created = function Created(result, contentType) {
    if (result && typeof result.then == 'function') {
        return result.then((result) => {
            return new ODataResult(201, contentType, result);
        });
    }
    else {
        return new es6_promise_1.Promise((resolve, reject) => {
            resolve(new ODataResult(201, contentType, result));
        });
    }
};
ODataResult.Ok = function Ok(result, contentType) {
    let inlinecount;
    if (result && typeof result.then == 'function') {
        return result.then((result) => {
            if (result && result.inlinecount) {
                inlinecount = result.inlinecount;
                delete result.inlinecount;
            }
            if (Array.isArray(result)) {
                result = { value: result };
                if (typeof inlinecount != "undefined")
                    result["@odata.count"] = inlinecount;
            }
            else {
                if (typeof result == "object" && result) {
                    result["@odata.count"] = inlinecount;
                }
            }
            return new ODataResult(200, contentType, result);
        });
    }
    else {
        return new es6_promise_1.Promise((resolve, reject) => {
            if (result && result.inlinecount) {
                inlinecount = result.inlinecount;
                delete result.inlinecount;
            }
            if (Array.isArray(result)) {
                result = { value: result };
                if (typeof inlinecount != "undefined")
                    result["@odata.count"] = inlinecount;
            }
            else {
                if (typeof result == "object" && result) {
                    result["@odata.count"] = inlinecount;
                }
            }
            resolve(new ODataResult(200, contentType, result));
        });
    }
};
ODataResult.NoContent = function NoContent(result, contentType) {
    if (result && typeof result.then == 'function') {
        return result.then((result) => {
            return new ODataResult(204, contentType);
        });
    }
    else {
        return new es6_promise_1.Promise((resolve, reject) => {
            resolve(new ODataResult(204, contentType));
        });
    }
};
exports.ODataResult = ODataResult;
//# sourceMappingURL=result.js.map