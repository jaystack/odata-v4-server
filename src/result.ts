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

    constructor(statusCode:number, result?:any){
        this.statusCode = statusCode;
        if (result){
            this.body = typeof result == "object" ? extend({}, result) : result;
            if (result && result.constructor) this.elementType = result.constructor;
        }
    }

    static Created = function Created(result:any):Promise<ODataResult>{
        if (result && typeof result.then == 'function'){
            return result.then((result) => {
                return new ODataResult(201, result);
            });
        }else{
            return new Promise((resolve, reject) => {
                resolve(new ODataResult(201, result));
            });
        }
    }

    static Ok = function Ok(result:any, innercount?:number):Promise<ODataResult>{
        if (result && typeof result.then == 'function'){
            return result.then((result) => {
                if (result && result.innercount){
                    innercount = result.innercount;
                    delete result.innercount;
                }
                if (Array.isArray(result)){
                    result = {
                        value: result,
                        "@odata.count": innercount
                    };
                }else{
                    if (typeof result == "object" && result){
                        result["@odata.count"] = innercount;
                    }
                }
                return new ODataResult(200, result);
            });
        }else{
            return new Promise((resolve, reject) => {
                if (result && result.innercount){
                    innercount = result.innercount;
                    delete result.innercount;
                }
                if (Array.isArray(result)){
                    result = {
                        value: result,
                        "@odata.count": innercount
                    };
                }else{
                    if (typeof result == "object" && result){
                        result["@odata.count"] = innercount;
                    }
                }
                resolve(new ODataResult(200, result));
            });
        }
    };

    static NoContent = function NoContent(result?:Promise<any>):Promise<ODataResult>{
        if (result && typeof result.then == 'function'){
            return result.then((result) => {
                return new ODataResult(204);
            });
        }else{
            return new Promise((resolve, reject) => {
                resolve(new ODataResult(204));
            });
        }
    }
}