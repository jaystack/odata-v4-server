export class CustomError extends Error{
    constructor(message?:string){
        super(message);
        this.message = message;
        this.name = (this as any).constructor.name;
        Error.captureStackTrace(this, CustomError);
    }
}

export class NotImplementedError extends CustomError{
    static MESSAGE:string = "Not implemented.";
    constructor(){
        super(NotImplementedError.MESSAGE);
    }
}

export class HttpRequestError extends CustomError{
    statusCode:number
    constructor(statusCode:number, message:string){
        super(message);
        this.statusCode = statusCode;
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