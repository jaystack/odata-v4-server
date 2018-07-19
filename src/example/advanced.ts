import { MongoClient, ObjectID, Db } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataServer, ODataQuery, createODataServer, ODataErrorHandler } from "../lib/index";
import { Category, Product, NorthwindTypes } from "./model";
import { Writable } from "stream";
let categories = require("./categories");
let products = require("./products");

const mongodb = async function():Promise<Db>{
    return (await MongoClient.connect("mongodb://localhost:27017/odataserver")).db();
};

@odata.type(Product)
@Edm.EntitySet("Products")
export class ProductsController extends ODataController{
    @odata.GET
    async find(@odata.query query:ODataQuery, @odata.stream stream:Writable){
        let mongodbQuery = createQuery(query);
        return (await mongodb()).collection("Products").find(mongodbQuery.query, { projection: mongodbQuery.projection, skip: mongodbQuery.skip, limit: mongodbQuery.limit }).stream().pipe(stream);
    }

    @odata.GET
    async findOne(@odata.key key:string, @odata.query query:ODataQuery){
        let mongodbQuery = createQuery(query);
        return (await mongodb()).collection("Products").findOne({ _id: key }, {
            fields: mongodbQuery.projection
        });
    }

    /*@odata.GET("Category")
    async getCategory(@odata.result result:any){
        return (await mongodb()).collection("Categories").findOne({ _id: result.CategoryId });
    }*/
}

@odata.type(Category)
@Edm.EntitySet("Categories")
export class CategoriesController extends ODataController{
    @odata.GET
    async find(@odata.query query:ODataQuery, @odata.stream stream:Writable){
        let mongodbQuery = createQuery(query);
        return (await mongodb()).collection("Categories").find(mongodbQuery.query, { projection: mongodbQuery.projection, skip: mongodbQuery.skip, limit: mongodbQuery.limit }).stream().pipe(stream);
    }

    @odata.GET
    async findOne(@odata.key() key:string, @odata.query query:ODataQuery){
        let mongodbQuery = createQuery(query);
        return (await mongodb()).collection("Categories").findOne({ _id: key }, {
            fields: mongodbQuery.projection
        });
    }

    /*@odata.GET("Products")
    async getProducts(@odata.result result:any, @odata.query query:ODataQuery, @odata.stream stream:Writable){
        let mongodbQuery = createQuery(query);
        mongodbQuery.query = { $and: [mongodbQuery.query, { CategoryId: result._id }] };
        return (await mongodb()).collection("Products").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).stream().pipe(stream);
    }*/
}

@odata.namespace("Northwind")
@Edm.Container(NorthwindTypes)
@odata.container("NorthwindContext")
@odata.controller(ProductsController)
@odata.controller(CategoriesController)
@odata.cors
export class NorthwindODataServer extends ODataServer{
    @Edm.EntityType(Category)
    @Edm.FunctionImport
    *GetCategoryById(@Edm.String id:string){
        return yield categories.filter((category: any) => category._id.toString() == id)[0];
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

    static errorHandler(err, req, res, next){
      delete err.stack;
      ODataErrorHandler(err, req, res, next);
    }
}

createODataServer(NorthwindODataServer, "/odata", 3000);

process.on("warning", warning => {
    console.log(warning.stack);
});

Error.stackTraceLimit = -1;