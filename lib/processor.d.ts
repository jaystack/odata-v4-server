import { Transform } from "stream";
import { ODataResult } from "./result";
import { ODataController } from "./controller";
import { NavigationPart } from "./visitor";
export declare type GeneratorAction = (value?) => {};
export declare namespace ODataGeneratorHandlers {
    function PromiseHandler(request: any, next: GeneratorAction): any;
    function StreamHandler(request: any, next: GeneratorAction): Promise<{}>;
}
export interface ODataProcessorOptions {
    disableEntityConversion: boolean;
}
export declare class ODataProcessor extends Transform {
    private serverType;
    private options;
    private ctrl;
    private prevCtrl;
    private instance;
    private resourcePath;
    private workflow;
    private context;
    private method;
    private url;
    private query;
    private entitySets;
    private odataContext;
    private body;
    private streamStart;
    private streamEnabled;
    private resultCount;
    constructor(context: any, server: any, options?: ODataProcessorOptions);
    _transform(chunk: any, encoding: string, done: Function): void;
    _flush(done?: Function): void;
    __EntityCollectionNavigationProperty(part: NavigationPart): Function;
    __EntityNavigationProperty(part: NavigationPart): Function;
    __PrimitiveProperty(part: NavigationPart): Function;
    __PrimitiveCollectionProperty(part: NavigationPart): Function;
    __ComplexProperty(part: NavigationPart): Function;
    __ComplexCollectionProperty(part: NavigationPart): Function;
    __read(ctrl: typeof ODataController, part: any, params: any, data?: any, filter?: string | Function, elementType?: any): Promise<{}>;
    __EntitySetName(part: NavigationPart): Function;
    __actionOrFunctionImport(part: NavigationPart): Function;
    __actionOrFunction(part: NavigationPart): Function;
    __appendODataContext(result: any, elementType: Function): void;
    __convertEntity(context: any, result: any, elementType: any): any;
    __enableStreaming(part: NavigationPart): void;
    __applyParams(container: any, name: string, params: any, queryString?: string, result?: any): void;
    execute(body?: any): Promise<ODataResult>;
}
