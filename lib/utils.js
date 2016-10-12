"use strict";
const patternSource = "[^(]*\\(([^)]*)\\)";
const pattern = new RegExp(patternSource);
exports.getFunctionParameters = function (fn, name) {
    let params = typeof name == "string" && typeof fn[name] == "function"
        ? fn[name].toString().match(new RegExp(name + patternSource))
        : fn.toString().match(pattern);
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