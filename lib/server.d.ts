import { NavigationPart } from "odata-v4-resource/lib/visitor";
import { ServiceMetadata } from "odata-v4-service-metadata";
import { ServiceDocument } from "odata-v4-service-document";
import { Promise } from "es6-promise";
import * as express from "express";
import { ODataResult } from "./result";
import { ODataController } from "./controller";
export declare class ODataProcessor {
    private serverType;
    private ctrl;
    private resourcePath;
    private workflow;
    private context;
    private method;
    private url;
    private entitySets;
    constructor(context: any, server: any);
    __EntityCollectionNavigationProperty(part: NavigationPart): Function;
    __EntityNavigationProperty(part: NavigationPart): Function;
    __PrimitiveProperty(part: NavigationPart): Function;
    __read(ctrl: typeof ODataController, part: any, params: any, data?: any, filter?: string): Promise<{}>;
    __EntitySetName(part: NavigationPart): Function;
    __actionOrFunctionImport(call: string, params: any): Function;
    __actionOrFunction(call: string, params: any): Function;
    execute(body?: any): Promise<ODataResult>;
}
export declare class ODataServer {
    private static _metadataCache;
    static namespace: string;
    static containerName: string;
    static requestHandler(): (req: any, res: any, next: any) => void;
    static createProcessor(context: any): ODataProcessor;
    static $metadata(): ServiceMetadata;
    static document(): ServiceDocument;
    static addController(controller: typeof ODataController, isPublic?: boolean): any;
    static addController(controller: typeof ODataController, isPublic?: boolean, elementType?: Function): any;
    static addController(controller: typeof ODataController, entitySetName?: string, elementType?: Function): any;
    static getController(elementType: Function): any;
}
export declare function ODataErrorHandler(err: any, req: any, res: any, next: any): void;
export declare function createODataServer(server: typeof ODataServer): express.Router;
export declare function createODataServer(server: typeof ODataServer, port: number): void;
export declare function createODataServer(server: typeof ODataServer, path: string, port: number): void;
export declare function createODataServer(server: typeof ODataServer, port: number, hostname: string): void;
