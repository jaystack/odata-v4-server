import "reflect-metadata";
import { ODataServer } from "./server";
import { ODataController } from "./controller";
export declare class ODataMethodType {
    static GET: string;
    static POST: string;
    static PUT: string;
    static PATCH: string;
    static DELETE: string;
}
export declare namespace odata {
    function type(elementType: Function): (constructor: Function) => void;
    function namespace(namespace: string): (target: any, targetKey?: string) => void;
    function container(name: string): (server: typeof ODataServer) => void;
    function controller(controller: typeof ODataController, isPublic?: boolean): any;
    function controller(controller: typeof ODataController, isPublic?: boolean, elementType?: Function): any;
    function controller(controller: typeof ODataController, entitySetName?: string, elementType?: Function): any;
    function getPublicControllers(server: typeof ODataServer): any;
    function cors(): (server: typeof ODataServer) => void;
    function GET(): (target: any, targetKey: any) => void;
    function POST(): (target: any, targetKey: any) => void;
    function PUT(): (target: any, targetKey: any) => void;
    function PATCH(): (target: any, targetKey: any) => void;
    function DELETE(): (target: any, targetKey: any) => void;
    function method(method: string): (target: any, targetKey: any) => void;
    function getMethod(target: any, targetKey: any): any;
    function key(name?: string): (target: any, targetKey: any, parameterIndex: number) => void;
    function getKeys(target: any, targetKey: any): any;
    function findODataMethod(target: any, method: any, keys: any): {
        call: string;
        key: any;
    };
    function query(): (target: any, targetKey: any, parameterIndex: number) => void;
    function getQueryParameter(target: any, targetKey: any): any;
    function filter(): (target: any, targetKey: any, parameterIndex: number) => void;
    function getFilterParameter(target: any, targetKey: any): any;
    function body(): (target: any, targetKey: any, parameterIndex: number) => void;
    function getBodyParameter(target: any, targetKey: any): any;
    function context(): (target: any, targetKey: any, parameterIndex: number) => void;
    function getContextParameter(target: any, targetKey: any): any;
    function stream(): (target: any, targetKey: any, parameterIndex: number) => void;
    function getStreamParameter(target: any, targetKey: any): any;
}
