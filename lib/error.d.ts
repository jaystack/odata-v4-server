export declare class CustomError extends Error {
    constructor(message?: string);
}
export declare class NotImplementedError extends CustomError {
    static MESSAGE: string;
    constructor();
}
export declare class HttpRequestError extends CustomError {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
export declare class ResourceNotFoundError extends HttpRequestError {
    static MESSAGE: string;
    constructor();
}
export declare class MethodNotAllowedError extends HttpRequestError {
    static MESSAGE: string;
    constructor();
}
