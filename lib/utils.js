"use strict";
const pattern = new RegExp("function[^(]*\\(([^)]*)\\)");
exports.getFunctionParameters = function (fn, name) {
    let params;
    if (!name)
        params = fn.toString().match(new RegExp("[^(]*\\(([^)]*)\\)"));
    else
        params = fn[name].toString().match(new RegExp(name + "[^(]*\\(([^)]*)\\)")) || fn[name].toString().match(pattern);
    return params[1].split(/,\s/);
};
exports.getAllPropertyNames = function (proto) {
    let propNames = Object.getOwnPropertyNames(proto);
    proto = Object.getPrototypeOf(proto);
    if (proto !== Object.prototype)
        propNames = propNames.concat(exports.getAllPropertyNames(proto));
    return propNames;
};
//# sourceMappingURL=utils.js.map