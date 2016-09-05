import { Db, Collection } from "mongodb";
import { Promise } from "es6-promise";
export declare class Provider {
    configuration: any;
    constructor(configuration?: any);
    createQueryOptions(req: any): any;
}
export declare class MongoDBProvider extends Provider {
    static connection: any;
    createQueryOptions(req: any): any;
    connect(): Promise<Db>;
    storage(collectionName: any): Promise<Collection>;
}
