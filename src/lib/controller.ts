import * as extend from "extend";
import { ODataServer } from "./server";
import { ODataResult } from "./result";
import { odata } from "./odata";
import { getFunctionParameters } from "./utils";

export class ODataController{
    entitySetName:string
    elementType:Function

    static on(method:string, fn:Function | string, ...keys:string[]){
        let fnName = <string>((<any>fn).name || fn);
        odata.method(method)(this.prototype, fnName);
        if (keys && keys.length > 0){
            fn = this.prototype[fnName];
            let parameterNames = getFunctionParameters(<Function>fn);
            keys.forEach((key) => {
                odata.key(this.prototype, fnName, parameterNames.indexOf(key));
            });
        }
    }
    static enableFilter(fn:Function | string, param?:string){
        let fnName = <string>((<any>fn).name || fn);
        fn = this.prototype[fnName];
        let parameterNames = getFunctionParameters(<Function>fn);
        odata.filter(this.prototype, fnName, parameterNames.indexOf(param || parameterNames[0]));
    }
}