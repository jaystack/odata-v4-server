"use strict";
var pattern = new RegExp("function[^(]*\\(([^)]*)\\)");
exports.getFunctionParameters = function (fn, name) {
    var params;
    if (!name)
        params = fn.toString().match(new RegExp("[^(]*\\(([^)]*)\\)")); //[1].split(/,\s/);
    else
        params = (fn[name].toString().match(pattern) || fn[name].toString().match(new RegExp(name + "[^(]*\\(([^)]*)\\)"))); //[1].split(/,\s/);
    return params[1].split(/,\s/);
};
//# sourceMappingURL=utils.js.map