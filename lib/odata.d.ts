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
    const cors: (server: typeof ODataServer) => void;
    /** Annotate function for OData GET operation
     * @param navigationProperty Navigation property name to handle
     */
    function GET(navigationProperty: string): any;
    function GET(): any;
    function GET(target?: any, targetKey?: string): any;
    /** Annotate function for OData POST operation
     * @param navigationProperty Navigation property name to handle
     */
    function POST(navigationProperty: string): any;
    function POST(): any;
    function POST(target?: any, targetKey?: string): any;
    /** Annotate function for OData PUT operation
     * @param navigationProperty Navigation property name to handle
     */
    function PUT(navigationProperty: string): any;
    function PUT(): any;
    function PUT(target?: any, targetKey?: string): any;
    /** Annotate function for OData PATCH operation
     * @param navigationProperty Navigation property name to handle
     */
    function PATCH(navigationProperty: string): any;
    function PATCH(): any;
    function PATCH(target?: any, targetKey?: string): any;
    /** Annotate function for OData DELETE operation
     * @param navigationProperty Navigation property name to handle
     */
    function DELETE(navigationProperty: string): any;
    function DELETE(): any;
    function DELETE(target?: any, targetKey?: string): any;
    /** Annotate function for a specified OData method operation */
    function method(method: string, navigationProperty?: string): (target: any, targetKey?: string) => any;
    function getMethod(target: any, targetKey: any): any;
    function key(name?: string): any;
    function key(target: any, targetKey: string, parameterIndex: number): any;
    function getKeys(target: any, targetKey: any): any;
    function findODataMethod(target: any, method: any, keys: any): {
        call: string;
        key: any;
    };
    const query: (target: any, targetKey: any, parameterIndex: number) => void;
    function getQueryParameter(target: any, targetKey: any): any;
    const filter: (target: any, targetKey: any, parameterIndex: number) => void;
    function getFilterParameter(target: any, targetKey: any): any;
    const body: (target: any, targetKey: any, parameterIndex: number) => void;
    function getBodyParameter(target: any, targetKey: any): any;
    const context: (target: any, targetKey: any, parameterIndex: number) => void;
    function getContextParameter(target: any, targetKey: any): any;
    const stream: (target: any, targetKey: any, parameterIndex: number) => void;
    function getStreamParameter(target: any, targetKey: any): any;
    const result: (target: any, targetKey: any, parameterIndex: number) => void;
    function getResultParameter(target: any, targetKey: any): any;
}
