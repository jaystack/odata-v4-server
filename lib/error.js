"use strict";
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, CustomError);
    }
}
exports.CustomError = CustomError;
class NotImplementedError extends CustomError {
    constructor() {
        super(NotImplementedError.MESSAGE);
    }
}
NotImplementedError.MESSAGE = "Not implemented.";
exports.NotImplementedError = NotImplementedError;
class HttpRequestError extends CustomError {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.HttpRequestError = HttpRequestError;
class ResourceNotFoundError extends HttpRequestError {
    constructor() {
        super(404, ResourceNotFoundError.MESSAGE);
    }
}
ResourceNotFoundError.MESSAGE = "Resource not found.";
exports.ResourceNotFoundError = ResourceNotFoundError;
class MethodNotAllowedError extends HttpRequestError {
    constructor() {
        super(405, MethodNotAllowedError.MESSAGE);
    }
}
MethodNotAllowedError.MESSAGE = "Method not allowed.";
exports.MethodNotAllowedError = MethodNotAllowedError;
//# sourceMappingURL=error.js.map