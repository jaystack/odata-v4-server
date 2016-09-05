"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var extend = require("extend");
var provider_1 = require("./provider");
var error_1 = require("./error");
var ODataController = (function () {
    function ODataController(req, res, next, server) {
        this.request = req;
        this.response = res;
        this.next = next;
        this.server = server;
    }
    return ODataController;
}());
exports.ODataController = ODataController;
var createKeyQuery = function () {
    var keys = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        keys[_i - 0] = arguments[_i];
    }
    var ctr = this.elementType;
    var keyQuery = null;
    if (keys.length > 0) {
        keyQuery = {};
        keys.forEach(function (key) {
            keyQuery[key.name] = key.value;
        });
        var entityKeyQuery_1 = new ctr(keyQuery);
        keys.forEach(function (key) {
            keyQuery[key.name] = entityKeyQuery_1[key.name];
        });
    }
    return keyQuery;
};
var ODataMongoDBController = (function (_super) {
    __extends(ODataMongoDBController, _super);
    function ODataMongoDBController(req, res, next, server) {
        _super.call(this, req, res, next, server);
        this.provider = new provider_1.MongoDBProvider(server.configuration);
        this.queryOptions = this.provider.createQueryOptions(this.request);
    }
    ODataMongoDBController.prototype.get = function () {
        var _this = this;
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i - 0] = arguments[_i];
        }
        return this.provider.storage(this.collectionName).then(function (collection) {
            var ctr = _this.elementType;
            var keyQuery = createKeyQuery.apply(_this, keys);
            var entityQuery = new ctr(_this.queryOptions.query);
            for (var prop in entityQuery) {
                if (entityQuery[prop] !== _this.queryOptions.query[prop]) {
                    _this.queryOptions.query[prop] = entityQuery[prop];
                }
            }
            var cursor = collection.find(extend(_this.queryOptions.query || {}, keyQuery || {}), _this.queryOptions.projection);
            if (keyQuery) {
                cursor = cursor.limit(1);
            }
            else {
                if (_this.queryOptions.sort)
                    cursor = cursor.sort(_this.queryOptions.sort);
                if (_this.queryOptions.skip)
                    cursor = cursor.skip(_this.queryOptions.skip);
                if (_this.queryOptions.limit)
                    cursor = cursor.limit(_this.queryOptions.limit);
            }
            if (_this.queryOptions.inlinecount) {
                return cursor.count(false).then(function (innercount) {
                    return cursor.toArray().then(function (docs) {
                        var result = (docs.map(function (doc) { return new ctr(doc); }));
                        result.innercount = innercount;
                        return result;
                    });
                });
            }
            else {
                if (keyQuery) {
                    return cursor.next().then(function (doc) {
                        var result = (new ctr(doc));
                        return result;
                    });
                }
                else {
                    return cursor.toArray().then(function (docs) {
                        var result = (docs.map(function (doc) { return new ctr(doc); }));
                        return result;
                    });
                }
            }
        });
    };
    ODataMongoDBController.prototype.post = function (entity) {
        var _this = this;
        return this.provider.storage(this.collectionName).then(function (collection) {
            var ctr = _this.elementType;
            return collection.insertOne(entity).then(function (result) {
                return new ctr(entity);
            });
        });
    };
    ODataMongoDBController.prototype.patch = function (delta) {
        var _this = this;
        var keys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            keys[_i - 1] = arguments[_i];
        }
        return this.provider.storage(this.collectionName).then(function (collection) {
            var ctr = _this.elementType;
            var keyQuery = createKeyQuery.apply(_this, keys) || {};
            for (var prop in keyQuery) {
                delete delta[prop];
            }
            return collection.findOneAndUpdate(keyQuery, { $set: delta }).then(function (writeOp) {
                if (writeOp.value == null)
                    throw new error_1.ResourceNotFoundError();
            });
        });
    };
    ODataMongoDBController.prototype.put = function (update) {
        var _this = this;
        var keys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            keys[_i - 1] = arguments[_i];
        }
        return this.provider.storage(this.collectionName).then(function (collection) {
            var ctr = _this.elementType;
            var keyQuery = createKeyQuery.apply(_this, keys) || {};
            for (var prop in keyQuery) {
                delete update[prop];
            }
            return collection.findOneAndUpdate(keyQuery, update, { returnOriginal: false }).then(function (writeOp) {
                if (writeOp.value == null)
                    throw new error_1.ResourceNotFoundError();
            });
        });
    };
    ODataMongoDBController.prototype.delete = function () {
        var _this = this;
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i - 0] = arguments[_i];
        }
        return this.provider.storage(this.collectionName).then(function (collection) {
            var ctr = _this.elementType;
            var keyQuery = createKeyQuery.apply(_this, keys) || {};
            return collection.remove(keyQuery).then(function (writeOp) {
                if (writeOp.result.n != 1)
                    throw new error_1.ResourceNotFoundError();
            });
        });
    };
    return ODataMongoDBController;
}(ODataController));
exports.ODataMongoDBController = ODataMongoDBController;
//# sourceMappingURL=controller.js.map