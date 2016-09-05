# OData V4 Server

OData V4 server for node.js

## Using from TypeScript

Use compiler options:
* experimentalDecorators
* emitDecoratorMetadata

## Northwind example server

```typescript
import { Promise } from "es6-promise";
import * as uuid from "node-uuid";
import { ObjectID } from "mongodb";
import { Edm, Entity, odata, ODataMongoDBController, MongoDBProvider, ODataServer, ODataErrorHandler, createODataServer } from "../index";
let categories = require("./categories");
let products = require("./products");

const toObjectID = _id => _id && !(_id instanceof ObjectID) ? ObjectID.createFromHexString(_id) : _id;

@odata.namespace("Northwind")
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

@odata.namespace("Northwind")
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
}

@odata.namespace("Northwind")
@odata.context("Products")
@odata.type(Product)
export class ProductsController<Product> extends ODataMongoDBController<Product>{}

@odata.namespace("Northwind")
@odata.context("Categories")
@odata.type(Category)
export class CategoriesController<Category> extends ODataMongoDBController<Category>{}

@odata.namespace("JayStack")
@odata.container("NorthwindContext")
@odata.controller(ProductsController)
@odata.controller(CategoriesController)
@odata.config({
    uri: "mongodb://localhost:27017/odataserver"
})
@odata.cors()
export class NorthwindODataServer extends ODataServer{
    @Edm.ActionImport()
    initDb():Promise<any>{
        let provider = new MongoDBProvider(this.configuration);
        return provider.connect().then((db) => {
            return db.dropDatabase().then(() => {
                let categoryCollection = db.collection("Categories");
                let productsCollection = db.collection("Products");
                return Promise.all([categoryCollection.insertMany(categories), productsCollection.insertMany(products)]);
            });
        });
    }
}

createODataServer(NorthwindODataServer, "/odata", 3000);
```

To use an Express router instead of an Express server:

```typescript
let app = express();
app.use("/odata", createODataServer(NorthwindODataServer));
app.listen(3000);
```

To use only the server middleware:

```typescript
let router = express.Router();
router.use(bodyParser.json());
router.use(cors());
router.get('/', server.document().requestHandler());
router.get('/\\$metadata', server.$metadata().requestHandler());
router.use(server.requestHandler(server));
router.use(ODataErrorHandler);

let app = express();
app.use("/odata", createODataServer(NorthwindODataServer));
app.listen(3000);
```