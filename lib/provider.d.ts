import { Db } from "mongodb";
import { Promise } from "es6-promise";
export declare class Provider {
    configuration: any;
    constructor(configuration?: any);
}
export declare class MongoDBProvider extends Provider {
    static connection: any;
    connect(): Promise<Db>;
    close(): void;
    storage(collectionName: any): Promise<any>;
    get<T>(collectionName: string, elementType: any, queryOptions: any, keys: any[]): Promise<T[] | T>;
}
