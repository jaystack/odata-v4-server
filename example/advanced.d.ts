import { ODataController, ODataServer, ODataQuery } from "../lib/index";
import { Product } from "./model";
export declare class ProductsController extends ODataController {
    find(filter: ODataQuery): Product[];
    findOne(key: string): Product;
    getCategory(result: any): Promise<any>;
}
export declare class CategoriesController extends ODataController {
    find(query: ODataQuery): Promise<any[]>;
    findOne(key: string, query: ODataQuery): Promise<any>;
    getProducts(result: any, query: ODataQuery): Promise<any[]>;
    GetFirstProduct(): any;
}
export declare class NorthwindODataServer extends ODataServer {
    GetCategoryById(id: string): IterableIterator<any>;
    initDb(): Promise<void>;
}
