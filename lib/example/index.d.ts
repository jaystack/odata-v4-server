import { Promise } from "es6-promise";
import { ObjectID } from "mongodb";
import { Entity, ODataMongoDBController, ODataServer } from "../index";
export declare class Product extends Entity {
    _id: ObjectID;
    CategoryId: string;
    Discontinued: boolean;
    Name: string;
    QuantityPerUnit: string;
    UnitPrice: number;
}
export declare class Category extends Entity {
    _id: ObjectID;
    Description: string;
    Name: string;
}
export declare class ProductsController<Product> extends ODataMongoDBController<Product> {
}
export declare class CategoriesController<Category> extends ODataMongoDBController<Category> {
}
export declare class NorthwindODataServer extends ODataServer {
    initDb(): Promise<any>;
}
