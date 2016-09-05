import { ODataServer } from "./server";
import { ODataController } from "./controller";
export declare namespace odata {
    function type(elementType: Function): (constructor: Function) => void;
    function context(collectionName: string): (constructor: Function) => void;
    function namespace(namespace: string): (target: any, targetKey?: string) => void;
    function container(name: string): (server: typeof ODataServer) => void;
    function controller(controller: typeof ODataController): (server: typeof ODataServer) => void;
    function config(configuration: any): (server: typeof ODataServer) => void;
    function cors(): (server: typeof ODataServer) => void;
}
