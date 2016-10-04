import { ObjectID } from "mongodb";
import { Token } from "odata-v4-parser/lib/lexer";
import { Entity, ODataController, ODataServer } from "../index";
export declare class Product extends Entity {
    _id: ObjectID;
    CategoryId: string;
    Category: Category;
    Discontinued: boolean;
    Name: string;
    QuantityPerUnit: string;
    UnitPrice: number;
}
export declare class Category extends Entity {
    _id: ObjectID;
    Description: string;
    Name: string;
    Products: Product[];
}
export declare class ProductsController extends ODataController {
    find(filter: Token): Product[];
    findOne(key: string): Product;
}
export declare class CategoriesController extends ODataController {
    find(query: Token): Promise<Category[]>;
    findOne(key: string, query: Token): Promise<Category>;
}
export declare class NorthwindODataServer extends ODataServer {
    initDb(): Promise<void>;
}
