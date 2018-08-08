import { MongoClient, Db, ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Token } from "odata-v4-parser/lib/lexer";
import { ODataServer, ODataController, odata } from "../lib/index";
let schemaJson = require("./schema");
let categories = require("./categories");
let products = require("./products");

const mongodb = async function (): Promise<Db> {
    return (await MongoClient.connect("mongodb://localhost:27017/odataserver")).db();
};

class ProductsController extends ODataController {
    @odata.GET
    *find( @odata.query query: Token) {
        let db: Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
        if (typeof mongodbQuery.query.CategoryId == "string") mongodbQuery.query.CategoryId = new ObjectID(mongodbQuery.query.CategoryId);
        return db.collection("Products").find(
            mongodbQuery.query, {
                projection: mongodbQuery.projection,
                skip: mongodbQuery.skip,
                limit: mongodbQuery.limit
            }
        ).toArray();
    }

    @odata.GET
    *findOne( @odata.key key: string, @odata.query query: Token) {
        let db: Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        return db.collection("Products").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }

    @odata.POST
    async insert( @odata.body data: any) {
        let db = await mongodb();
        if (data.CategoryId) data.CategoryId = new ObjectID(data.CategoryId);
        return await db.collection("Products").insert(data).then((result) => {
            data._id = result.insertedId;
            return data;
        });
    }
}

class CategoriesController extends ODataController {
    @odata.GET
    *find( @odata.query query: Token): any {
        let db: Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
        return db.collection("Categories").find(
            mongodbQuery.query, {
                projection: mongodbQuery.projection,
                skip: mongodbQuery.skip,
                limit: mongodbQuery.limit
            }
        ).toArray();
    }

    @odata.GET
    *findOne( @odata.key key: string, @odata.query query: Token) {
        let db: Db = yield mongodb();
        let mongodbQuery = createQuery(query);
        return db.collection("Categories").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        });
    }
}

@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, true)
class NorthwindServer extends ODataServer {
    async initDb() {
        let db = await mongodb();
        await db.dropDatabase();
        let categoryCollection = db.collection("Categories");
        let productsCollection = db.collection("Products");
        await categoryCollection.insertMany(categories);
        await productsCollection.insertMany(products);
    }
}
NorthwindServer.$metadata(schemaJson);
NorthwindServer.create("/odata", 3000);