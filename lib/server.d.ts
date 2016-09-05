import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import * as express from "express";
export declare class ODataServer {
    private static _metadataCache;
    static namespace: string;
    static containerName: string;
    configuration: any;
    constructor(configuration?: any);
    static requestHandler(configuration?: any): (req: any, res: any, next: any) => any;
    static $metadata(): ServiceMetadata;
    static document(): ServiceDocument;
}
export declare function ODataErrorHandler(err: any, req: any, res: any, next: any): void;
export declare function createODataServer(server: typeof ODataServer): express.Router;
export declare function createODataServer(server: typeof ODataServer, port: number): void;
export declare function createODataServer(server: typeof ODataServer, path: string, port: number): void;
export declare function createODataServer(server: typeof ODataServer, port: number, hostname: string): void;
