import { Token } from "odata-v4-parser/lib/lexer";
import * as odata from "./odata";
import { ODataBase } from "./odata";
import { getFunctionParameters } from "./utils";

export class ODataControllerBase{
    entitySetName:string
    elementType:Function
    static containerName:string
    static validator:(odataQuery:string | Token) => null;

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

    /** Enables the filtering
     * @param fn
     * @param param
     */
    static enableFilter(fn:Function | string, param?:string){
        let fnName = <string>((<any>fn).name || fn);
        fn = this.prototype[fnName];
        let parameterNames = getFunctionParameters(<Function>fn);
        odata.filter(this.prototype, fnName, parameterNames.indexOf(param || parameterNames[0]));
    }
}
export class ODataController extends ODataBase<ODataControllerBase, typeof ODataControllerBase>(ODataControllerBase){}