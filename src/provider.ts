import { MongoClient, MongoClientOptions, Db, Collection } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Visitor as QueryVisitor } from "odata-v4-mongodb/lib/visitor";
import * as url from "url";
import { Promise } from "es6-promise";
import { NotImplementedError } from "./error";

export class Provider{
    configuration:any
    constructor(configuration?:any){
        this.configuration = configuration || {};
    }
    createQueryOptions(req:any):any{
        throw new NotImplementedError();
    }
}

export class MongoDBProvider extends Provider{
    static connection:any = {};
    createQueryOptions(req:any):any{
        let qs = url.parse(req.url).query;
        return qs ? createQuery(qs) : new QueryVisitor();
    }
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
    storage(collectionName):Promise<Collection>{
        return this.connect().then((db) => {
            return db.collection(collectionName);
        });
    }
}