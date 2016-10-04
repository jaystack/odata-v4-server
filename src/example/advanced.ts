import * as uuid from "node-uuid";
import { MongoClient, ObjectID, Collection, Db } from "mongodb";
import { Token } from "odata-v4-parser/lib/lexer";
import { FilterVisitor } from "odata-v4-inmemory/lib/FilterVisitor";
import { createQuery as mongodbQuery } from "odata-v4-mongodb";
import { Visitor as MongoDBVisitor } from "odata-v4-mongodb/lib/visitor";
import { Edm, Entity, odata, ODataController, ODataServer, ODataErrorHandler, createODataServer } from "../index";
let categories = require("./categories");
let products = require("./products");

const toObjectID = _id => _id && !(_id instanceof ObjectID) ? ObjectID.createFromHexString(_id) : _id;

@Edm.Annotate({
    term: "UI.DisplayName",
    string: "Products"
})
export class Product extends Entity{
    @Edm.Key()
    @Edm.Computed()
    @Edm.String()
    @Edm.Convert(toObjectID)
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product identifier"
    }, {
        term: "UI.ControlHint",
        string: "ReadOnly"
    })
    _id:ObjectID
    @Edm.String()
    @Edm.Required()
    @Edm.Convert(toObjectID)
    CategoryId:string
    @Edm.ForeignKey("CategoryId")
    @Edm.EntityType("Category")
    Category:Category
    @Edm.Boolean()
    Discontinued:boolean
    @Edm.String()
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product title"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    Name:string
    @Edm.String()
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product English name"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    QuantityPerUnit:string
    @Edm.Decimal()
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Unit price of product"
    }, {
        term: "UI.ControlHint",
        string: "Decimal"
    })
    UnitPrice:number
}

@Edm.Annotate({
    term: "UI.DisplayName",
    string: "Categories"
})
export class Category extends Entity{
    @Edm.Key()
    @Edm.Computed()
    @Edm.String()
    @Edm.Convert(toObjectID)
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Category identifier"
    },
    {
        term: "UI.ControlHint",
        string: "ReadOnly"
    })
    _id:ObjectID
    @Edm.String()
    Description:string
    @Edm.String()
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Category name"
    },
    {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    Name:string
    @Edm.ForeignKey("CategoryId")
    @Edm.Collection(Edm.EntityType("Product"))
    Products:Product[]
}

const mongodb = async function():Promise<Db>{
    return await MongoClient.connect("mongodb://localhost:27017/odataserver");
};

@odata.type(Product)
@Edm.EntitySet("Products")
export class ProductsController extends ODataController{
    @odata.method("GET")
    find(@odata.filter() filter:Token):Product[]{
        if (filter){
            let filterFn = new FilterVisitor().Visit(filter, {});
            return products.map((product) => {
                product._id = product._id.toString();
                product.CategoryId = product.CategoryId.toString();
                return product;
            }).filter((product) => filterFn(product)).map(product => new Product(product));
        }
        return products.map(product => new Product(product));
    }

    @odata.method("GET")
    findOne(@odata.key() key:string):Product{
        let product = products.filter(product => product._id.toString() == key)[0];
        return product ? new Product(product) : null;
    }
}

@odata.type(Category)
@Edm.EntitySet("Categories")
export class CategoriesController extends ODataController{
    @odata.GET()
    async find(@odata.query() query:Token){
        let mongodbQuery = new MongoDBVisitor().Visit(<Token>query);
        return await (await mongodb()).collection("Categories").find(mongodbQuery.query, mongodbQuery.projection, mongodbQuery.skip, mongodbQuery.limit).toArray().then((categories) => categories.map(category => new Category(category)));
    }

    @odata.GET()
    async findOne(@odata.key() key:string, @odata.query() query:Token){
        let mongodbQuery = new MongoDBVisitor().Visit(<Token>query);
        return await (await mongodb()).collection("Categories").findOne({ _id: new ObjectID(key) }, {
            fields: mongodbQuery.projection
        }).then((category) => new Category(category));
    }
}

@odata.namespace("Northwind")
@odata.container("NorthwindContext")
@odata.controller(ProductsController)
@odata.controller(CategoriesController)
@odata.cors()
export class NorthwindODataServer extends ODataServer{
    @Edm.ActionImport()
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