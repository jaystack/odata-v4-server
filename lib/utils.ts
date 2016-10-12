const patternSource = "[^(]*\\(([^)]*)\\)";
const pattern = new RegExp(patternSource);
export const getFunctionParameters = function(fn:Function, name?:string){
    let params = typeof name == "string" && typeof fn[name] == "function"
        ? fn[name].toString().match(new RegExp(name + patternSource))
        : fn.toString().match(pattern);
    return params[1].split(/,\s/);
};
export const getAllPropertyNames = function(proto:any):string[]{
    let propNames = Object.getOwnPropertyNames(proto);
    proto = Object.getPrototypeOf(proto);
    if (proto !== Object.prototype) propNames = propNames.concat(getAllPropertyNames(proto));
    return propNames;
};