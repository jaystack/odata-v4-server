import { Promise } from "es6-promise";
import * as extend from "extend";

export interface IODataResult{
    "@odata.context":string
    "@odata.count":number
    value:any
}

export class ODataResult{
    statusCode:number
    body:IODataResult
    elementType:Function
    contentType:string

    constructor(statusCode:number, contentType?:string, result?:any){
        this.statusCode = statusCode;
        if (result){
            this.body = typeof result == "object" ? extend({}, result) : result;
            if (result && result.constructor) this.elementType = result.constructor;
            this.contentType = contentType || "application/json";
        }
    }

    static Created = function Created(result:any, contentType?:string):Promise<ODataResult>{
        if (result && typeof result.then == 'function'){
            return result.then((result) => {
                return new ODataResult(201, contentType, result);
            });
        }else{
            return new Promise((resolve, reject) => {
                resolve(new ODataResult(201, contentType, result));
            });
        }
    }

    static Ok = function Ok(result:any, contentType?:string):Promise<ODataResult>{
        let inlinecount;
        if (result && typeof result.then == 'function'){
            return result.then((result) => {
                if (result && result.inlinecount){
                    inlinecount = result.inlinecount;
                    delete result.inlinecount;
                }
                if (Array.isArray(result)){
                    result = { value: result };
                    if (typeof inlinecount != "undefined") result["@odata.count"] = inlinecount;
                }else{
                    if (typeof result == "object" && result){
                        result["@odata.count"] = inlinecount;
                    }
                }
                return new ODataResult(200, contentType, result);
            });
        }else{
            return new Promise((resolve, reject) => {
                if (result && result.inlinecount){
                    inlinecount = result.inlinecount;
                    delete result.inlinecount;
                }
                if (Array.isArray(result)){
                    result = { value: result };
                    if (typeof inlinecount != "undefined") result["@odata.count"] = inlinecount;
                }else{
                    if (typeof result == "object" && result){
                        result["@odata.count"] = inlinecount;
                    }
                }
                resolve(new ODataResult(200, contentType, result));
            });
        }
    };

    static NoContent = function NoContent(result?:any, contentType?:string):Promise<ODataResult>{
        if (result && typeof result.then == 'function'){
            return result.then((result) => {
                return new ODataResult(204, contentType);
            });
        }else{
            return new Promise((resolve, reject) => {
                resolve(new ODataResult(204, contentType));
            });
        }
    }
}