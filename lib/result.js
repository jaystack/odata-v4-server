"use strict";
const es6_promise_1 = require("es6-promise");
const extend = require("extend");
class ODataResult {
    constructor(statusCode, result) {
        this.statusCode = statusCode;
        if (result) {
            this.body = typeof result == "object" ? extend({}, result) : { value: result };
            if (result && result.constructor)
                this.elementType = result.constructor;
        }
    }
}
ODataResult.Created = function Created(result) {
    if (result && typeof result.then == 'function') {
        return result.then((result) => {
            return new ODataResult(201, result);
        });
    }
    else {
        return new es6_promise_1.Promise((resolve, reject) => {
            resolve(new ODataResult(201, result));
        });
    }
};
ODataResult.Ok = function Ok(result, innercount) {
    if (result && typeof result.then == 'function') {
        return result.then((result) => {
            if (result && result.innercount) {
                innercount = result.innercount;
                delete result.innercount;
            }
            if (Array.isArray(result)) {
                result = {
                    value: result,
                    "@odata.count": innercount
                };
            }
            else {
                if (typeof result == "object" && result) {
                    result["@odata.count"] = innercount;
                }
            }
            return new ODataResult(200, result);
        });
    }
    else {
        return new es6_promise_1.Promise((resolve, reject) => {
            if (result && result.innercount) {
                innercount = result.innercount;
                delete result.innercount;
            }
            if (Array.isArray(result)) {
                result = {
                    value: result,
                    "@odata.count": innercount
                };
            }
            else {
                if (typeof result == "object" && result) {
                    result["@odata.count"] = innercount;
                }
            }
            resolve(new ODataResult(200, result));
        });
    }
};
ODataResult.NoContent = function NoContent(result) {
    if (result && typeof result.then == 'function') {
        return result.then((result) => {
            return new ODataResult(204);
        });
    }
    else {
        return new es6_promise_1.Promise((resolve, reject) => {
            resolve(new ODataResult(204));
        });
    }
};
exports.ODataResult = ODataResult;
//# sourceMappingURL=result.js.map