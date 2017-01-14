import { MongoClient, ObjectID, Collection, Db } from "mongodb";
import { createFilter, createQuery } from "odata-v4-mongodb";
import * as extend from "extend";
import { Edm, odata, ODataController, ODataServer, ODataQuery, ODataErrorHandler, ResourceNotFoundError, createODataServer } from "../lib/index";
import { Category, Product } from "./model";
import { Writable } from "stream";
let categories = require("./categories");
let products = require("./products");

const mongodb = async function():Promise<Db>{
    return await MongoClient.connect("mongodb://localhost:27017/odataserver");
};

@odata.type(Product)
@Edm.EntitySet("Products")
export class ProductsController extends ODataController{
    @odata.GET
    async find(@odata.query query:ODataQuery, @odata.stream stream:Writable){
        let mongodbQuery = createQuery(query);
        if (mongodbQuery.query.CategoryId) mongodbQuery.query.CategoryId = new ObjectID(mongodbQuery.query.CategoryId);
        return (await mongodb()).collection("Products").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).stream().pipe(stream);
    }

    @odata.GET
    async findOne(@odata.key key:string, @odata.query query:ODataQuery){
        let mongodbQuery = createQuery(query);
        return (await mongodb()).collection("Products").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }

    @odata.GET("Category")
    async getCategory(@odata.result result:any){
        return (await mongodb()).collection("Categories").findOne({ _id: result.CategoryId });
    }
}

@odata.type(Category)
@Edm.EntitySet("Categories")
export class CategoriesController extends ODataController{
    @odata.GET
    async find(@odata.query query:ODataQuery, @odata.stream stream:Writable){
        let mongodbQuery = createQuery(query);
        return (await mongodb()).collection("Categories").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).stream().pipe(stream);
    }

    @odata.GET
    async findOne(@odata.key() key:string, @odata.query query:ODataQuery){
        let mongodbQuery = createQuery(query);
        return (await mongodb()).collection("Categories").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }

    @odata.GET("Products")
    async getProducts(@odata.result result:any, @odata.query query:ODataQuery, @odata.stream stream:Writable){
        let mongodbQuery = createQuery(query);
        mongodbQuery.query = { $and: [mongodbQuery.query, { CategoryId: result._id }] };
        return (await mongodb()).collection("Products").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).stream().pipe(stream);
    }
}

@odata.namespace("Northwind")
@odata.container("NorthwindContext")
@odata.controller(ProductsController)
@odata.controller(CategoriesController)
@odata.cors
export class NorthwindODataServer extends ODataServer{
    @Edm.EntityType(Category)
    @Edm.FunctionImport
    *GetCategoryById(@Edm.String id:string){
        return yield categories.filter((category) => category._id.toString() == id)[0];
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