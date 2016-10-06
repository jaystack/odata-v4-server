import * as fs from "fs";
import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { Writable } from "stream";
import { MongoClient, Collection, Db, ObjectID } from "mongodb";
import { Visitor as MongoDBVisitor } from "odata-v4-mongodb/lib/visitor";
import { Token } from "odata-v4-parser/lib/lexer";
import { Stream } from "stream";
import { ODataServer, ODataController, Edm, odata, ODataErrorHandler } from "../index";
import { Category, Product } from "./model";

const mongodb = async function():Promise<Db>{
    return await MongoClient.connect("mongodb://localhost:27017/odataserver");
};

@odata.type(Product)
class ProductsController extends ODataController{
    @odata.GET()
    *find(@odata.query() query:Token, @odata.stream() stream:Writable):any{
        let db:Db = yield mongodb();
        let mongodbQuery = new MongoDBVisitor().Visit(<Token>query);
        if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
        if (typeof mongodbQuery.query.CategoryId == "string") mongodbQuery.query.CategoryId = new ObjectID(mongodbQuery.query.CategoryId);
        return db.collection("Products")
            .find(
                mongodbQuery.query,
                mongodbQuery.projection,
                mongodbQuery.skip,
                mongodbQuery.limit
            ).stream().pipe(stream);
    }

    @odata.GET()
    *findOne(@odata.key() key:string, @odata.query() query:Token){
        let db:Db = yield mongodb();
        let mongodbQuery = new MongoDBVisitor().Visit(<Token>query);
        return db.collection("Products").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }
}

@odata.type(Category)
class CategoriesController extends ODataController{
    @odata.GET()
    *find(@odata.query() query:Token, @odata.stream() stream:Writable){
        let db:Db = yield mongodb();
        let mongodbQuery = new MongoDBVisitor().Visit(<Token>query);
        if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
        return db.collection("Categories")
            .find(
                mongodbQuery.query,
                mongodbQuery.projection,
                mongodbQuery.skip,
                mongodbQuery.limit
            ).stream().pipe(stream);
    }

    @odata.GET()
    *findOne(@odata.key() key:string, @odata.query() query:Token){
        let db:Db = yield mongodb();
        let mongodbQuery = new MongoDBVisitor().Visit(<Token>query);
        return db.collection("Categories").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }
}

@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, true)
class StreamServer extends ODataServer{
    @Edm.FunctionImport(Edm.Stream)
    async Fetch(@Edm.String() filename:string, @odata.stream() stream:Writable, @odata.context() context:any){
        let file = fs.createReadStream(filename);
        context.response.contentType(path.extname(filename));
        return file.on("open", () => {
            file.pipe(stream);
        });
    }
}

StreamServer.create("/odata", 3000);