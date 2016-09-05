"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var mongodb_1 = require("mongodb");
var odata_v4_mongodb_1 = require("odata-v4-mongodb");
var visitor_1 = require("odata-v4-mongodb/lib/visitor");
var url = require("url");
var es6_promise_1 = require("es6-promise");
var error_1 = require("./error");
var Provider = (function () {
    function Provider(configuration) {
        this.configuration = configuration || {};
    }
    Provider.prototype.createQueryOptions = function (req) {
        throw new error_1.NotImplementedError();
    };
    return Provider;
}());
exports.Provider = Provider;
var MongoDBProvider = (function (_super) {
    __extends(MongoDBProvider, _super);
    function MongoDBProvider() {
        _super.apply(this, arguments);
    }
    MongoDBProvider.prototype.createQueryOptions = function (req) {
        var qs = url.parse(req.url).query;
        return qs ? odata_v4_mongodb_1.createQuery(qs) : new visitor_1.Visitor();
    };
    MongoDBProvider.prototype.connect = function () {
        var _this = this;
        return new es6_promise_1.Promise(function (resolve, reject) {
            var cache = _this.constructor.connection[_this.configuration.url];
            if (cache)
                return resolve(cache);
            mongodb_1.MongoClient.connect(_this.configuration.uri, _this.configuration.options, function (err, db) {
                if (err)
                    return reject(err);
                _this.constructor.connection[_this.configuration.url] = db;
                resolve(db);
            });
        });
    };
    MongoDBProvider.prototype.storage = function (collectionName) {
        return this.connect().then(function (db) {
            return db.collection(collectionName);
        });
    };
    MongoDBProvider.connection = {};
    return MongoDBProvider;
}(Provider));
exports.MongoDBProvider = MongoDBProvider;
//# sourceMappingURL=provider.js.map