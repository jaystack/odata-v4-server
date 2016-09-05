const pattern = new RegExp("function[^(]*\\(([^)]*)\\)");
export const getFunctionParameters = function(fn:Function, name?:string){
    let params;
    if (!name) params = fn.toString().match(new RegExp("[^(]*\\(([^)]*)\\)"));//[1].split(/,\s/);
    else params = (fn[name].toString().match(pattern) || fn[name].toString().match(new RegExp(name + "[^(]*\\(([^)]*)\\)")));//[1].split(/,\s/);
    return params[1].split(/,\s/);
};