import { MongoClient, MongoClientOptions, Db, Collection } from "mongodb";
//import { createQuery } from "odata-v4-mongodb";
import { Visitor as QueryVisitor } from "odata-v4-mongodb/lib/visitor";
import * as extend from "extend";
import * as url from "url";
import { ExpandVisitor, createQuery } from "./expand";
import { Promise } from "es6-promise";
import { NotImplementedError } from "./error";

export class Provider{
    configuration:any
    constructor(configuration?:any){
        this.configuration = configuration || {};
    }
}

const createKeyQuery:Function = function(elementType, keys:any[]):any{
    let ctr:any = elementType;
    let keyQuery = null;
    if (keys.length > 0){
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

export class MongoDBProvider extends Provider{
    static connection:any = {};
    connect():Promise<Db>{
        return new Promise((resolve, reject) => {
            let cache = (<typeof MongoDBProvider>this.constructor).connection[this.configuration.url];
            if (cache) return resolve(cache);
            MongoClient.connect(this.configuration.uri, <MongoClientOptions>this.configuration.options, (err, db) => {
                if (err) return reject(err);
                (<typeof MongoDBProvider>this.constructor).connection[this.configuration.url] = db;
                resolve(db);
            });
        });
    }
    close(){
        let db = (<typeof MongoDBProvider>this.constructor).connection[this.configuration.url];
        if (db){
            db.close();
        }
    }
    storage(collectionName):Promise<any>{
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
    get<T>(collectionName:string, elementType:any, queryOptions:any, keys:any[]):Promise<T[] | T>{
        return this.storage(collectionName).then((collection) => {
            let ctr:any = elementType;
            let keyQuery = createKeyQuery(elementType, keys);
            let entityQuery = new ctr(queryOptions.query);
            for (let prop in entityQuery){
                if (entityQuery[prop] !== queryOptions.query[prop]){
                    queryOptions.query[prop] = entityQuery[prop];
                }
            }
            let cursor = collection.find(extend(queryOptions.query || {}, keyQuery || {}), queryOptions.projection);
            if (keyQuery){
                cursor = cursor.limit(1);
            }else{
                if (queryOptions.sort) cursor = cursor.sort(queryOptions.sort);
                if (queryOptions.skip) cursor = cursor.skip(queryOptions.skip);
                if (queryOptions.limit) cursor = cursor.limit(queryOptions.limit);
            }
            if (queryOptions.inlinecount){
                return cursor.count(false).then((innercount) => {
                    return cursor.toArray().then((docs) => {
                        let result:any = <T[]>(docs.map((doc) => { return new ctr(doc); }));
                        result.innercount = innercount;
                        return result;
                    });
                });
            }else{
                if (keyQuery){
                    return cursor.next().then((doc) => {
                        let result:T = doc ? <T>(new ctr(doc)) : doc;
                        return result;
                    });
                }else{
                    return cursor.toArray().then((docs) => {
                        if (queryOptions.includes){
                            return Promise.all(queryOptions.includes.map((include) => {
                                var navigationElementType = null;
                                var isCollection = false;
                            })).then(() => {
                                let result:any = <T[]>(docs.map((doc) => { return doc ? new ctr(doc) : doc; }));
                                return result;
                            });
                        }else{
                            let result:any = <T[]>(docs.map((doc) => { return doc ? new ctr(doc) : doc; }));
                            return result;
                        }
                    });
                }
            }
        });
    }
}