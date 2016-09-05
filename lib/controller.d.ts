import { Visitor as QueryVisitor } from "odata-v4-mongodb/lib/visitor";
import { Promise } from "es6-promise";
import { ODataServer } from "./server";
import { MongoDBProvider } from "./provider";
export declare abstract class ODataController<T> {
    collectionName: string;
    elementType: Function;
    request: any;
    response: any;
    next: any;
    server: ODataServer;
    constructor(req: any, res: any, next: any, server: any);
    abstract get(...keys: any[]): Promise<T[] | T>;
    abstract post(entity: T): Promise<T>;
    abstract patch(delta: T, ...keys: any[]): Promise<void>;
    abstract put(update: T, ...keys: any[]): Promise<void>;
    abstract delete(...keys: any[]): Promise<void>;
}
export declare class ODataMongoDBController<T> extends ODataController<T> {
    provider: MongoDBProvider;
    queryOptions: QueryVisitor;
    constructor(req: any, res: any, next: any, server: any);
    get(...keys: any[]): Promise<T[] | T>;
    post(entity: T): Promise<T>;
    patch(delta: T, ...keys: any[]): Promise<void>;
    put(update: T, ...keys: any[]): Promise<void>;
    delete(...keys: any[]): Promise<void>;
}
