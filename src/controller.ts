import { Visitor as QueryVisitor } from "odata-v4-mongodb/lib/visitor";
import { ExpandVisitor } from "./expand";
import { Promise } from "es6-promise";
import * as extend from "extend";
import { ODataServer } from "./server";
import { ODataResult } from "./result";
import { MongoDBProvider } from "./provider";
import { ResourceNotFoundError } from "./error";
import { odata } from "./odata";
import { getFunctionParameters } from "./utils";

export interface IODataController<T>{
    get?(...keys:any[]):Promise<T[] | T>;
    post?(entity:T):Promise<T>;
    patch?(delta:T, ...keys:any[]):Promise<void>;
    put?(update:T, ...keys:any[]):Promise<void>;
    delete?(...keys:any[]):Promise<void>;
}

export abstract class ODataController implements IODataController<any>{
    entitySetName:string
    elementType:Function

    static on(method:string, fn:Function | string, ...keys:string[]){
        let fnName = <string>((<Function>fn).name || fn);
        odata.method(method)(this.prototype, fnName);
        if (keys && keys.length > 0){
            fn = this.prototype[fnName];
            let parameterNames = getFunctionParameters(<Function>fn);
            keys.forEach((key) => {
                odata.key()(this.prototype, fnName, parameterNames.indexOf(key));
            });
        }
    }
    static enableFilter(fn:Function | string, param?:string){
        let fnName = <string>((<Function>fn).name || fn);
        fn = this.prototype[fnName];
        let parameterNames = getFunctionParameters(<Function>fn);
        odata.filter()(this.prototype, fnName, parameterNames.indexOf(param || parameterNames[0]));
    }
}

/*export class ODataStreamController<T> extends ODataController{

}

export class ODataMongoDBController<T> extends ODataController implements IODataController<T>{
    provider:MongoDBProvider
    queryOptions:ExpandVisitor

    constructor(context, server){
        super(context, server);
        this.provider = new MongoDBProvider(server.configuration);
        this.queryOptions = this.provider.createQueryOptions(this.context.url);
    }

    get(...keys:any[]):Promise<T[] | T>{
        return this.provider.get<T>(this.collectionName, this.elementType, this.queryOptions, keys);
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
            let keyQuery = MongoDBProvider.createKeyQuery(this.elementType, keys) || {};
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
            let keyQuery = MongoDBProvider.createKeyQuery(this.elementType, keys) || {};
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
            let keyQuery = MongoDBProvider.createKeyQuery(this.elementType, keys) || {};
            return collection.remove(keyQuery).then((writeOp) => {
                if (writeOp.result.n != 1) throw new ResourceNotFoundError();
            });
        });
    }
}*/