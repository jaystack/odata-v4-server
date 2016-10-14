import { Token } from "odata-v4-parser/lib/lexer";
import { ODataController, ODataServer } from "../lib/index";
import { Product } from "./model";
export declare class ProductsController extends ODataController {
    find(filter: Token): Product[];
    findOne(key: string): Product;
}
export declare class CategoriesController extends ODataController {
    find(query: Token): Promise<any[]>;
    findOne(key: string, query: Token): Promise<any>;
    GetFirstProduct(): any;
}
export declare class NorthwindODataServer extends ODataServer {
    GetCategoryById(id: string): any;
    initDb(): Promise<void>;
}
