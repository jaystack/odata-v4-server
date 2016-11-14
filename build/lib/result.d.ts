export interface IODataResult {
    "@odata.context"?: string;
    "@odata.count"?: number;
    value?: any;
    [x: string]: any;
}
export declare class ODataResult {
    statusCode: number;
    body: IODataResult;
    elementType: Function;
    contentType: string;
    constructor(statusCode: number, contentType?: string, result?: any);
    static Created: (result: any, contentType?: string) => Promise<ODataResult>;
    static Ok: (result: any, contentType?: string) => Promise<ODataResult>;
    static NoContent: (result?: any, contentType?: string) => Promise<ODataResult>;
}
