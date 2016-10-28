import * as fs from "fs";
import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { Writable } from "stream";
import { MongoClient, Collection, Db, ObjectID } from "mongodb";
import { createFilter, createQuery } from "odata-v4-mongodb";
import { Token } from "odata-v4-parser/lib/lexer";
import { Readable, PassThrough } from "stream";
import { ODataServer, ODataController, Edm, odata, ODataErrorHandler } from "../lib/index";
import { Category, Product } from "./model";

const mongodb = async function():Promise<Db>{
    return await MongoClient.connect("mongodb://localhost:27017/odataserver");
};

@odata.type(Product)
class ProductsController extends ODataController{
    @odata.GET
    *find(@odata.query query:Token, @odata.stream stream:Writable):any{
        let db:Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
        if (typeof mongodbQuery.query.CategoryId == "string") mongodbQuery.query.CategoryId = new ObjectID(mongodbQuery.query.CategoryId);
        let categories = db.collection("Categories");
        return db.collection("Products")
            .find(
                mongodbQuery.query,
                mongodbQuery.projection,
                mongodbQuery.skip,
                mongodbQuery.limit
            ).stream().pipe(stream);
    }
    /* example using generator with mongodb .next() and passing entity data into OData stream
    @odata.GET
    *find(@odata.query query:Token, @odata.stream stream:Writable){
        let db:Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
        if (typeof mongodbQuery.query.CategoryId == "string") mongodbQuery.query.CategoryId = new ObjectID(mongodbQuery.query.CategoryId);
        let cursor = db.collection("Products")
            .find(
                mongodbQuery.query,
                mongodbQuery.projection,
                mongodbQuery.skip,
                mongodbQuery.limit
            );
        let item = yield cursor.next();
        while (item){
            stream.write(item);
            item = yield cursor.next();
        }
        stream.end();
    }*/

    @odata.GET
    *findOne(@odata.key() key:string, @odata.query query:Token){
        let db:Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        return db.collection("Products").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }

    @odata.POST
    async insert(@odata.body data:any){
        let db = await mongodb();
        if (data.CategoryId) data.CategoryId = new ObjectID(data.CategoryId);
        return await db.collection("Products").insert(data).then((result) => {
            data._id = result.insertedId;
            return data;
        });
    }
}

@odata.type(Category)
class CategoriesController extends ODataController{
    @odata.GET
    *find(@odata.query query:Token, @odata.stream stream:Writable):any{
        let db:Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
        let cursor = db.collection("Categories")
            .find(
                mongodbQuery.query,
                mongodbQuery.projection,
                mongodbQuery.skip,
                mongodbQuery.limit
            );
        let result = yield cursor.toArray();
        result.inlinecount = yield cursor.count(false);
        return result;
    }

    @odata.GET
    *findOne(@odata.key() key:string, @odata.query query:Token){
        let db:Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        return db.collection("Categories").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }
}

@Edm.MediaEntity("audio/mpeg")
class Music extends PassThrough{
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    Id:number

    @Edm.String
    Artist:string

    @Edm.String
    Title:string
}

@odata.type(Music)
class MusicController extends ODataController{
    @odata.GET
    mp3(@odata.key() key:number){
        let music = new Music();
        music.Id = 1;
        music.Artist = "Opeth";
        music.Title = "Sorceress";
        let file = fs.createReadStream("../sorceress.mp3");
        return new Promise((resolve, reject) => {
            file.on("open", () => {
                file.pipe(music);
                resolve(music);
            }).on("error", reject);
        });
    }
}

@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, true)
@odata.controller(MusicController, true)
class StreamServer extends ODataServer{
    @Edm.FunctionImport(Edm.Stream)
    async Fetch(@Edm.String filename:string, @odata.stream stream:Writable, @odata.context context:any){
        let file = fs.createReadStream(filename);
        return file.on("open", () => {
            context.response.contentType(path.extname(filename));
            file.pipe(stream);
        });
    }
}

StreamServer.create("/odata", 3000);