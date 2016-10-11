const pattern = new RegExp("function[^(]*\\(([^)]*)\\)");
export const getFunctionParameters = function(fn:Function, name?:string){
    let params;
    if (!name) params = fn.toString().match(new RegExp("[^(]*\\(([^)]*)\\)"));
    else params = fn[name].toString().match(new RegExp(name + "[^(]*\\(([^)]*)\\)")) || fn[name].toString().match(pattern);
    return params[1].split(/,\s/);
};
export const getAllPropertyNames = function(proto:any):string[]{
    let propNames = Object.getOwnPropertyNames(proto);
    proto = Object.getPrototypeOf(proto);
    if (proto !== Object.prototype) propNames = propNames.concat(getAllPropertyNames(proto));
    return propNames;
};