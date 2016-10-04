import { Promise } from "es6-promise";
export interface IODataController<T> {
    get?(...keys: any[]): Promise<T[] | T>;
    post?(entity: T): Promise<T>;
    patch?(delta: T, ...keys: any[]): Promise<void>;
    put?(update: T, ...keys: any[]): Promise<void>;
    delete?(...keys: any[]): Promise<void>;
}
export declare abstract class ODataController implements IODataController<any> {
    entitySetName: string;
    elementType: Function;
    static on(method: string, fn: Function | string, ...keys: string[]): void;
    static enableFilter(fn: Function | string, param?: string): void;
}
