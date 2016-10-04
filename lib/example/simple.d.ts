import { Token } from "odata-v4-parser/lib/lexer";
import { ODataController, ODataServer } from "../index";
export declare class ProductsController extends ODataController {
    find(filter: Token): any;
    findOne(key: string): any;
    insert(product: any): any;
    update(key: string, delta: any): void;
}
export declare class CategoriesController extends ODataController {
    find(filter: Token): any;
    findOne(key: string): any;
    insert(category: any): any;
    update(key: string, delta: any): void;
}
export declare class NorthwindODataServer extends ODataServer {
}
