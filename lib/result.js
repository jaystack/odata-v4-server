"use strict";
var es6_promise_1 = require("es6-promise");
var ODataResult = (function () {
    function ODataResult(statusCode, result) {
        this.statusCode = statusCode;
        this.body = result;
    }
    ODataResult.Created = function Created(result) {
        if (result && typeof result.then == 'function') {
            return result.then(function (result) {
                return new ODataResult(201, result);
            });
        }
        else {
            return new es6_promise_1.Promise(function (resolve, reject) {
                resolve(new ODataResult(201, result));
            });
        }
    };
    ODataResult.Ok = function Ok(result, innercount) {
        if (result && typeof result.then == 'function') {
            return result.then(function (result) {
                if (result.innercount) {
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
                    if (typeof result == "object") {
                        result["@odata.count"] = innercount;
                    }
                }
                return new ODataResult(200, result);
            });
        }
        else {
            return new es6_promise_1.Promise(function (resolve, reject) {
                if (Array.isArray(result)) {
                    result = {
                        value: result,
                        "@odata.count": innercount
                    };
                }
                else {
                    if (typeof result == "object") {
                        result["@odata.count"] = innercount;
                    }
                }
                resolve(new ODataResult(200, result));
            });
        }
    };
    ODataResult.NoContent = function NoContent(result) {
        if (result && typeof result.then == 'function') {
            return result.then(function (result) {
                return new ODataResult(204);
            });
        }
        else {
            return new es6_promise_1.Promise(function (resolve, reject) {
                resolve(new ODataResult(204));
            });
        }
    };
    return ODataResult;
}());
exports.ODataResult = ODataResult;
//# sourceMappingURL=result.js.map