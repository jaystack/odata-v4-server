/// <reference types="mocha" />
import { ODataController, ODataServer, ODataQuery, odata, HttpRequestError } from "../lib/index";

class ValidationError extends HttpRequestError{
    constructor(){
        super(400, "ODataValidationError");
    }
}

class MyCustomValidation{
    static validate(query:string | ODataQuery){
        // throw error when using any query
        if ((typeof query == "object" && query && query.type != "ODataUri") || typeof query == "string") throw new ValidationError();
    }
}

class BaseController extends ODataController{
    @odata.GET
    query(@odata.query ast:ODataQuery){
        return [];
    }

    @odata.GET
    filter(@odata.key id:number, @odata.filter ast:ODataQuery){
        return {};
    }
}

@odata.validation(MyCustomValidation, {})
class ValidationController extends BaseController{}

class NoValidationController extends BaseController{}

@odata.validation(MyCustomValidation, {})
@odata.controller(ValidationController, true)
@odata.controller(NoValidationController, true)
class ValidationServer extends ODataServer{}

describe("ODataValidation", () => {
    it("should throw validation error (@odata.query)", () => {
        return new Promise((resolve, reject) => {
            try{
                ValidationServer.execute("/Validation?$filter=Id eq 1").then(() => {
                    reject(new Error("should throw validation error"));
                }, (err) => {
                    if (err instanceof ValidationError) return resolve();
                    reject(new Error("should throw validation error"));
                }).catch(err => {
                    resolve();
                });
            }catch(err){
                if (err instanceof ValidationError) return resolve();
                reject(new Error("should throw validation error"));
            }
        });
    });

    it("should throw validation error (@odata.filter)", () => {
        return new Promise((resolve, reject) => {
            try{
                ValidationServer.execute("/Validation(1)?$filter=Id eq 1").then(() => {
                    reject(new Error("should throw validation error"));
                }, (err) => {
                    if (err instanceof ValidationError) return resolve();
                    reject(new Error("should throw validation error"));
                }).catch(err => {
                    resolve();
                });
            }catch(err){
                if (err instanceof ValidationError) return resolve();
                reject(new Error("should throw validation error"));
            }
        });
    });

    it("should pass without validation error (@odata.query)", () => {
        return new Promise((resolve, reject) => {
            ValidationServer.execute("/Validation").then(() => {
                resolve();
            }, (err) => {
                if (err instanceof ValidationError) return reject(new Error("should pass without validation error"));
                resolve();
            });
        });
    });

    it("should pass without validation error (@odata.filter)", () => {
        return new Promise((resolve, reject) => {
            ValidationServer.execute("/Validation(1)").then(() => {
                resolve();
            }, (err) => {
                if (err instanceof ValidationError) return reject(new Error("should pass without validation error"));
                resolve();
            });
        });
    });

    it("should pass without validation error (@odata.query without @odata.validation)", () => {
        return new Promise((resolve, reject) => {
            ValidationServer.execute("/NoValidation?$filter=Id eq 1").then(() => {
                resolve();
            }, (err) => {
                if (err instanceof ValidationError) return reject(new Error("should pass without validation error"));
                resolve();
            });
        });
    });

    it("should pass without validation error (@odata.filter without @odata.validation)", () => {
        return new Promise((resolve, reject) => {
            ValidationServer.execute("/NoValidation(1)?$filter=Id eq 1").then(() => {
                resolve();
            }, (err) => {
                if (err instanceof ValidationError) return reject(new Error("should pass without validation error"));
                resolve();
            });
        });
    });
});