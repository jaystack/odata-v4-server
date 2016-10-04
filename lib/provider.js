"use strict";
const mongodb_1 = require("mongodb");
const extend = require("extend");
const es6_promise_1 = require("es6-promise");
class Provider {
    constructor(configuration) {
        this.configuration = configuration || {};
    }
}
exports.Provider = Provider;
const createKeyQuery = function (elementType, keys) {
    let ctr = elementType;
    let keyQuery = null;
    if (keys.length > 0) {
        keyQuery = {};
        keys.forEach((key) => {
            keyQuery[key.name] = key.value;
        });
        let entityKeyQuery = new ctr(keyQuery);
        keys.forEach((key) => {
            keyQuery[key.name] = entityKeyQuery[key.name];
        });
    }
    return keyQuery;
};
class MongoDBProvider extends Provider {
    connect() {
        return new es6_promise_1.Promise((resolve, reject) => {
            let cache = this.constructor.connection[this.configuration.url];
            if (cache)
                return resolve(cache);
            mongodb_1.MongoClient.connect(this.configuration.uri, this.configuration.options, (err, db) => {
                if (err)
                    return reject(err);
                this.constructor.connection[this.configuration.url] = db;
                resolve(db);
            });
        });
    }
    close() {
        let db = this.constructor.connection[this.configuration.url];
        if (db) {
            db.close();
        }
    }
    storage(collectionName) {
        return this.connect().then((db) => {
            let collection = db.collection(collectionName);
            return collection;
            /*return {
                filter: (query) => {
                    let queryOptions = new QueryVisitor().Visit(query);
                    return this.get(collectionName, )
                }
            };*/
        });
    }
    get(collectionName, elementType, queryOptions, keys) {
        return this.storage(collectionName).then((collection) => {
            let ctr = elementType;
            let keyQuery = createKeyQuery(elementType, keys);
            let entityQuery = new ctr(queryOptions.query);
            for (let prop in entityQuery) {
                if (entityQuery[prop] !== queryOptions.query[prop]) {
                    queryOptions.query[prop] = entityQuery[prop];
                }
            }
            let cursor = collection.find(extend(queryOptions.query || {}, keyQuery || {}), queryOptions.projection);
            if (keyQuery) {
                cursor = cursor.limit(1);
            }
            else {
                if (queryOptions.sort)
                    cursor = cursor.sort(queryOptions.sort);
                if (queryOptions.skip)
                    cursor = cursor.skip(queryOptions.skip);
                if (queryOptions.limit)
                    cursor = cursor.limit(queryOptions.limit);
            }
            if (queryOptions.inlinecount) {
                return cursor.count(false).then((innercount) => {
                    return cursor.toArray().then((docs) => {
                        let result = (docs.map((doc) => { return new ctr(doc); }));
                        result.innercount = innercount;
                        return result;
                    });
                });
            }
            else {
                if (keyQuery) {
                    return cursor.next().then((doc) => {
                        let result = doc ? (new ctr(doc)) : doc;
                        return result;
                    });
                }
                else {
                    return cursor.toArray().then((docs) => {
                        if (queryOptions.includes) {
                            return es6_promise_1.Promise.all(queryOptions.includes.map((include) => {
                                var navigationElementType = null;
                                var isCollection = false;
                            })).then(() => {
                                let result = (docs.map((doc) => { return doc ? new ctr(doc) : doc; }));
                                return result;
                            });
                        }
                        else {
                            let result = (docs.map((doc) => { return doc ? new ctr(doc) : doc; }));
                            return result;
                        }
                    });
                }
            }
        });
    }
}
MongoDBProvider.connection = {};
exports.MongoDBProvider = MongoDBProvider;
//# sourceMappingURL=provider.js.map