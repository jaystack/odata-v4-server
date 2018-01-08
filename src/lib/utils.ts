import { Transform } from "stream";
import { ODataStream } from "./result";

const patternSource = "[^(]*\\(([^)]*)\\)";
const pattern = new RegExp(patternSource);
export const getFunctionParameters = function(fn:Function, name?:string){
    let params = typeof name == "string" && typeof fn[name] == "function"
        ? fn[name].toString().match(new RegExp(`(?:${name})?` + patternSource))
        : fn.toString().match(pattern);
    return params[1].split(/,(?:\s)?/).map(p => p.split(" ")[0]);
};
export const getAllPropertyNames = function(proto:any):string[]{
    let propNames = Object.getOwnPropertyNames(proto);
    proto = Object.getPrototypeOf(proto);
    if (proto !== Object.prototype && proto !== Transform.prototype) propNames = propNames.concat(getAllPropertyNames(proto));
    return propNames;
};
let GeneratorFunction;
try{ GeneratorFunction = eval("(function*() {}).constructor"); }catch(err){}

export function isIterator(value){
    return value instanceof GeneratorFunction;
}

export function isPromise(value){
    return value && typeof value.then == "function";
}

export function isStream(stream){
    return stream !== null && typeof stream == "object" && typeof stream.pipe == "function" && !(stream instanceof ODataStream);
}

export interface PropertyDecorator<T>{
    (target?:any, targetKey?:string): T;
}
export interface Decorator<T = any>{
    (target?:any, targetKey?:string, parameterIndex?:number | TypedPropertyDescriptor<T>): T
}