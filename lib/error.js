"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CustomError = (function (_super) {
    __extends(CustomError, _super);
    function CustomError(message) {
        _super.call(this, message);
        this.message = message;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, CustomError);
    }
    return CustomError;
}(Error));
exports.CustomError = CustomError;
var NotImplementedError = (function (_super) {
    __extends(NotImplementedError, _super);
    function NotImplementedError() {
        _super.call(this, NotImplementedError.MESSAGE);
    }
    NotImplementedError.MESSAGE = "Not implemented.";
    return NotImplementedError;
}(CustomError));
exports.NotImplementedError = NotImplementedError;
var HttpRequestError = (function (_super) {
    __extends(HttpRequestError, _super);
    function HttpRequestError(statusCode, message) {
        _super.call(this, message);
        this.statusCode = statusCode;
    }
    return HttpRequestError;
}(CustomError));
exports.HttpRequestError = HttpRequestError;
var ResourceNotFoundError = (function (_super) {
    __extends(ResourceNotFoundError, _super);
    function ResourceNotFoundError() {
        _super.call(this, 404, ResourceNotFoundError.MESSAGE);
    }
    ResourceNotFoundError.MESSAGE = "Resource not found.";
    return ResourceNotFoundError;
}(HttpRequestError));
exports.ResourceNotFoundError = ResourceNotFoundError;
//# sourceMappingURL=error.js.map