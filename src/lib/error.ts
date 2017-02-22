export class CustomError extends Error{
    constructor(message?:string){
        super(message);
        this.message = message;
        this.name = (this as any).constructor.name;
        Error.captureStackTrace(this, CustomError);
    }
}

export class HttpRequestError extends CustomError{
    statusCode:number
    constructor(statusCode:number, message:string){
        super(message);
        this.statusCode = statusCode;
    }
}

export class NotImplementedError extends HttpRequestError{
    static MESSAGE:string = "Not implemented.";
    constructor(){
        super(501, NotImplementedError.MESSAGE);
    }
}

export class ResourceNotFoundError extends HttpRequestError{
    static MESSAGE:string = "Resource not found.";
    constructor(){
        super(404, ResourceNotFoundError.MESSAGE);
    }
}

export class MethodNotAllowedError extends HttpRequestError{
    static MESSAGE:string = "Method not allowed.";
    constructor(){
        super(405, MethodNotAllowedError.MESSAGE);
    }
}

export class UnsupportedMediaTypeError extends HttpRequestError{
    static MESSAGE:string = "Unsupported media type.";
    constructor(){
        super(415, UnsupportedMediaTypeError.MESSAGE);
    }
}
