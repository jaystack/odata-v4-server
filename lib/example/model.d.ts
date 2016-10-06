import { ObjectID } from "mongodb";
import { Entity } from "../index";
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
