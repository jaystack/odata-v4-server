import { Promise } from "es6-promise";
export interface IODataResult {
    "@odata.context": string;
    "@odata.count": number;
    value: any;
}
export declare class ODataResult {
    statusCode: number;
    body: IODataResult;
    elementType: Function;
    constructor(statusCode: number, result?: any);
    static Created: (result: any) => Promise<ODataResult>;
    static Ok: (result: any, innercount?: number) => Promise<ODataResult>;
    static NoContent: (result?: Promise<any>) => Promise<ODataResult>;
}
