import { Visitor as QueryVisitor } from "odata-v4-mongodb/lib/visitor";
import { Promise } from "es6-promise";
import * as extend from "extend";
import { ODataServer } from "./server";
import { ODataResult } from "./result";
import { MongoDBProvider } from "./provider";
import { ResourceNotFoundError } from "./error";

export abstract class ODataController<T>{
    collectionName:string
    elementType:Function

    request:any
    response:any
    next:any
    server:ODataServer

    constructor(req, res, next, server){
        this.request = req;
        this.response = res;
        this.next = next;
        this.server = server;
    }

    abstract get(...keys:any[]):Promise<T[] | T>;
    abstract post(entity:T):Promise<T>;
    abstract patch(delta:T, ...keys:any[]):Promise<void>;
    abstract put(update:T, ...keys:any[]):Promise<void>;
    abstract delete(...keys:any[]):Promise<void>;
}

const createKeyQuery = function(...keys:any[]):any{
    let ctr:any = this.elementType;
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

export class ODataMongoDBController<T> extends ODataController<T>{
    provider:MongoDBProvider
    queryOptions:QueryVisitor

    constructor(req, res, next, server){
        super(req, res, next, server);
        this.provider = new MongoDBProvider(server.configuration);
        this.queryOptions = this.provider.createQueryOptions(this.request);
    }

    get(...keys:any[]):Promise<T[] | T>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            let keyQuery = createKeyQuery.apply(this, keys);
            let entityQuery = new ctr(this.queryOptions.query);
            for (let prop in entityQuery){
                if (entityQuery[prop] !== this.queryOptions.query[prop]){
                    this.queryOptions.query[prop] = entityQuery[prop];
                }
            }
            let cursor = collection.find(extend(this.queryOptions.query || {}, keyQuery || {}), this.queryOptions.projection);
            if (keyQuery){
                cursor = cursor.limit(1);
            }else{
                if (this.queryOptions.sort) cursor = cursor.sort(this.queryOptions.sort);
                if (this.queryOptions.skip) cursor = cursor.skip(this.queryOptions.skip);
                if (this.queryOptions.limit) cursor = cursor.limit(this.queryOptions.limit);
            }
            if ((<any>this.queryOptions).inlinecount){
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
                        let result:T = <T>(new ctr(doc));
                        return result;
                    });
                }else{
                    return cursor.toArray().then((docs) => {
                        let result:T[] = <T[]>(docs.map((doc) => { return new ctr(doc); }));
                        return result;
                    });
                }
            }
        });
    }

    post(entity:T):Promise<T>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            return collection.insertOne(entity).then((result) => {
                return new ctr(entity);
            });
        });
    }
    patch(delta:T, ...keys:any[]):Promise<void>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            let keyQuery = createKeyQuery.apply(this, keys) || {};
            for (let prop in keyQuery){
                delete delta[prop];
            }
            return collection.findOneAndUpdate(keyQuery, { $set: delta }).then((writeOp) => {
                if (writeOp.value == null) throw new ResourceNotFoundError();
            });
        });
    }
    put(update:T, ...keys:any[]):Promise<void>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            let keyQuery = createKeyQuery.apply(this, keys) || {};
            for (let prop in keyQuery){
                delete update[prop];
            }
            return collection.findOneAndUpdate(keyQuery, update, { returnOriginal: false }).then((writeOp) => {
                if (writeOp.value == null) throw new ResourceNotFoundError();
            });
        });
    }
    delete(...keys:any[]):Promise<void>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            let keyQuery = createKeyQuery.apply(this, keys) || {};
            return collection.remove(keyQuery).then((writeOp) => {
                if (writeOp.result.n != 1) throw new ResourceNotFoundError();
            });
        });
    }
}