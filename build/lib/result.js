"use strict";
const extend = require("extend");
class ODataResult {
    constructor(statusCode, contentType, result) {
        this.statusCode = statusCode;
        if (typeof result != "undefined") {
            this.body = typeof result == "object" && result ? extend({}, result) : result;
            if (result && result.constructor)
                this.elementType = result.constructor;
            this.contentType = contentType || (typeof this.body == "object" ? "application/json" : "text/plain");
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
        return new Promise((resolve, reject) => {
            resolve(new ODataResult(201, contentType, result));
        });
    }
};
ODataResult.Ok = function Ok(result, contentType) {
    let inlinecount;
    if (result && typeof result.then == 'function') {
        return result.then((result) => {
            if (Array.isArray(result)) {
                if (result && result.inlinecount && typeof result.inlinecount == "number") {
                    inlinecount = result.inlinecount;
                    delete result.inlinecount;
                }
                result = { value: result };
                if (typeof inlinecount != "undefined")
                    result["@odata.count"] = inlinecount;
            }
            else {
                if (typeof result == "object" && result && typeof inlinecount == "number") {
                    result["@odata.count"] = inlinecount;
                }
            }
            return new ODataResult(200, contentType, result);
        });
    }
    else {
        return new Promise((resolve, reject) => {
            if (Array.isArray(result)) {
                if (result && result.inlinecount && typeof result.inlinecount == "number") {
                    inlinecount = result.inlinecount;
                    delete result.inlinecount;
                }
                result = { value: result };
                if (typeof inlinecount == "number")
                    result["@odata.count"] = inlinecount;
            }
            else {
                if (typeof result == "object" && result && typeof inlinecount == "number") {
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
        return new Promise((resolve, reject) => {
            resolve(new ODataResult(204, contentType));
        });
    }
};
exports.ODataResult = ODataResult;
//# sourceMappingURL=result.js.map