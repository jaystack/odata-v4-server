import { MongoClient, ObjectID, Collection, Db } from "mongodb";
import { Token } from "odata-v4-parser/lib/lexer";
import { createFilter } from "odata-v4-inmemory";
import { createQuery } from "odata-v4-mongodb";
import * as extend from "extend";
import { Edm, odata, ODataController, ODataServer, ODataErrorHandler, createODataServer } from "../lib/index";
import { Category, Product } from "./model";
let categories = require("./categories");
let products = require("./products");

const mongodb = async function():Promise<Db>{
    return await MongoClient.connect("mongodb://localhost:27017/odataserver");
};

@odata.type(Product)
@Edm.EntitySet("Products")
export class ProductsController extends ODataController{
    @odata.GET
    find(@odata.filter filter:Token):Product[]{
        if (filter){
            let filterFn = createFilter(filter);
            return products.map((product) => {
                let result = extend({}, product);
                result._id = result._id.toString();
                result.CategoryId = result.CategoryId.toString();
                return result;
            }).filter((product) => filterFn(product));
        }
        return products;
    }

    @odata.GET
    findOne(@odata.key key:string):Product{
        return products.filter(product => product._id.toString() == key)[0] || null;
    }

    @odata.GET("Category")
    async getCategory(@odata.result result:any){
        return await (await mongodb()).collection("Categories").findOne({ _id: result.CategoryId });
    }
}

@odata.type(Category)
@Edm.EntitySet("Categories")
export class CategoriesController extends ODataController{
    @odata.GET
    async find(@odata.query query:Token){
        let mongodbQuery = createQuery(query);
        return await (await mongodb()).collection("Categories").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).toArray();
    }

    @odata.GET
    async findOne(@odata.key() key:string, @odata.query query:Token){
        let mongodbQuery = createQuery(query);
        return await (await mongodb()).collection("Categories").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }

    @odata.GET("Products")
    async getProducts(@odata.result result:any, @odata.query query:Token){
        let mongodbQuery = createQuery(query);
        mongodbQuery.query = { $and: [mongodbQuery.query, { CategoryId: result._id }] };
        return await (await mongodb()).collection("Products").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).toArray();
    }

    @Edm.Function(Edm.EntityType(Product))
    GetFirstProduct(){
        return products[0];
    }
}

@odata.namespace("Northwind")
@odata.container("NorthwindContext")
@odata.controller(ProductsController)
@odata.controller(CategoriesController)
@odata.cors
export class NorthwindODataServer extends ODataServer{
    @Edm.FunctionImport(Edm.EntityType(Category))
    GetCategoryById(@Edm.String id:string){
        return categories.filter((category) => category._id.toString() == id)[0];
    }

    @Edm.ActionImport
    async initDb():Promise<void>{
        let db = await mongodb();
        await db.dropDatabase();
        let categoryCollection = db.collection("Categories");
        let productsCollection = db.collection("Products");
        await categoryCollection.insertMany(categories);
        await productsCollection.insertMany(products);
    }
}

createODataServer(NorthwindODataServer, "/odata", 3000);