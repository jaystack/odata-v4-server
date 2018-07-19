/// <reference types="mocha" />
import { Token } from "odata-v4-parser/lib/lexer";
import { createFilter } from "odata-v4-inmemory";
import { ODataController, ODataServer, ODataProcessor, ODataMethodType, ODataResult, Edm, odata, ODataHttpContext, ODataStream, ODataEntity } from "../lib/index";
import { Product, Category } from "./model/model";
import { ProductPromise, CategoryPromise } from "./model/ModelsForPromise";
import { GeneratorProduct, GeneratorCategory } from "./model/ModelsForGenerator";
import { StreamProduct, StreamCategory } from "./model/ModelsForStream";
import { Readable, PassThrough, Writable } from "stream";
import { ObjectID } from "mongodb";
import { processQueries, doOrderby, doSkip, doTop } from "./utils/queryOptions"
import * as fs from "fs";
import * as path from "path";
import * as streamBuffers from "stream-buffers";
const extend = require("extend");
let categories = require("./model/categories").slice();
let products = require("./model/products").slice();
let categories2 = require("./model/categories").slice();
let products2 = require("./model/products").slice();

const serverCache = [];
if (typeof after == "function"){
    after(function(){
        serverCache.forEach(server => server.close());
    });
}

export class Foobar {
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    id: number

    @Edm.Int16
    a: number

    @Edm.String
    foo: string

    @Edm.Action
    Foo() { }

    @Edm.Function(Edm.String)
    Bar() {
        return "foobar";
    }

    @odata.namespace("Echo")
    @Edm.Function(Edm.String)
    echo( @Edm.String message) {
        return message;
    }

    @odata.namespace("Echo")
    @Edm.Function(Edm.Collection(Edm.String))
    echoMany( @Edm.String message) {
        return [message];
    }
}

export class Image {
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    Id: number

    @Edm.String
    Filename: string

    @Edm.Stream("image/png")
    Data: ODataStream

    @Edm.Stream("image/png")
    Data2: ODataStream
}

@Edm.MediaEntity("audio/mp3")
export class Music extends PassThrough {
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    Id: number

    @Edm.String
    Artist: string

    @Edm.String
    Title: string
}
let foobarObj = { id: 1, foo: 'bar' };
let foobarObj2 = { id: 2, foo: 'bar', a: 'a' };
@odata.type(Foobar)
export class SyncTestController extends ODataController {
    @odata.GET
    entitySet(/*@odata.query query:Token, @odata.context context:any, @odata.result result:any, @odata.stream stream:ODataProcessor*/) {
        return [{ id: 1, a: 1 }];
    }

    @odata.GET()
    entity( @odata.key() key: number) {
        if (key === 1) return ODataResult.Ok(foobarObj);
        if (key === 2) return ODataResult.Ok(foobarObj2);
        if (key === 999) return ODataResult.Ok({ id: key, foo: "999" });
        return ODataResult.Ok({ id: key, foo: "bar" });
    }

    @odata.method("POST")
    insert( @odata.body body: any) {
        if (!body.id) body.id = 1;
        return body;
    }

    put( @odata.body body: any) {
        body.id = 1;
    }

    patch( @odata.key key: number, @odata.body delta: any) {
        if (key === 2) return Object.assign(foobarObj2, delta);
        return Object.assign({
            id: key,
            foo: "bar",
            a: 'a'
        }, delta);
    }

    @odata.PUT('foo')
    putProperty( @odata.body body: any, @odata.result _: Foobar) {
        foobarObj.foo = body.foo;
    }

    @odata.PATCH('foo')
    patchProperty( @odata.body body: any, @odata.result _: Foobar) {
        foobarObj.foo = body.foo;
    }

    @odata.DELETE('foo')
    deleteProperty( @odata.result _: Foobar) {
        if (foobarObj.foo) foobarObj.foo = null;
    }

    @odata.method(ODataMethodType.DELETE)
    remove() { }

    @Edm.Function(Edm.EntityType(Foobar))
    getFoo() {
        return foobarObj;
    }
}

@odata.type(Foobar)
export class GeneratorTestController extends ODataController {
    @odata.GET
    *entitySet() {
        return [{ id: 1, a: 1 }];
    }
}

@odata.type(Foobar)
export class AsyncTestController extends ODataController {
    @odata.GET
    entitySet() {
        return new Promise((resolve, reject) => {
            try {
                setTimeout(() => {
                    resolve([{ id: 1, a: 1 }]);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    @odata.GET
    entity( @odata.key key: number) {
        return ODataResult.Ok(new Promise((resolve, reject) => {
            try {
                setTimeout(() => {
                    const a: number = 1;
                    let result = { id: key };
                    (<any>result).inlinecount = a;
                    resolve(result);
                });
            } catch (err) {
                reject(err);
            }
        }));
    }

    @odata.POST
    insert( @odata.body body: any) {
        return new Promise((resolve, reject) => {
            try {
                setTimeout(() => {
                    body.id = 1;
                    resolve(body);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

@odata.type(Foobar)
export class InlineCountController extends ODataController {
    @odata.GET
    entitySet() {
        let result = [{ id: 1, a: 1 }];
        (<any>result).inlinecount = 1;
        return result;
    }
}

@odata.type(Foobar)
export class BoundOperationController extends ODataController {
    @Edm.Action
    Action() {
        return new Promise((resolve) => {
            setTimeout(resolve);
        });
    }

    @Edm.Function(Edm.String)
    Function( @Edm.Int16 value: number) {
        return `foobar:${value}`;
    }

    @Edm.Function(Edm.String)
    FunctionMore( @Edm.String message: string, @Edm.Int64 value: number) {
        return `The number is ${value} and your message was ${message}.`;
    }

    @odata.GET
    entitySet() {
        return [{ id: 1, a: 1 }];
    }

    @odata.GET
    entity( @odata.key key: number) {
        return { id: key, a: 1 };
    }
}

@odata.type(Image)
export class ImagesController extends ODataController {
    @odata.GET
    entitySet( @odata.query _: Token, @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let image = new Image();
        image.Id = 1;
        image.Filename = "tmp.png";
        return [image];
    }

    @odata.GET()
    entity( @odata.key() key: number) {
        let image = new Image();
        image.Id = key;
        image.Filename = "tmp.png";
        return image;
    }

    @odata.GET("Data")
    getData( @odata.key _: number, @odata.context context: ODataHttpContext) {
        let globalReadableImgStrBuffer = new streamBuffers.ReadableStreamBuffer();
        globalReadableImgStrBuffer.put("tmp.png");
        globalReadableImgStrBuffer.stop();
        return globalReadableImgStrBuffer;
    }

    @odata.POST("Data")
    postData( @odata.key _: number, @odata.body data: Readable) {
        let globalWritableImgStrBuffer = new streamBuffers.WritableStreamBuffer();
        return data.pipe(globalWritableImgStrBuffer);
    }

    @odata.GET("Data2")
    getData2( @odata.key _: number, @odata.stream stream: Writable, @odata.context context: ODataHttpContext) {
        return new ODataStream(fs.createReadStream(path.join(__dirname, "..", "..", "src", "test", "fixtures", "logo_jaystack.png"))).pipe(context.response);
    }

    @odata.POST("Data2")
    postData2( @odata.key _: number, @odata.body data: Readable) {
        return new ODataStream(fs.createWriteStream(path.join(__dirname, "..", "..", "src", "test", "fixtures", "tmp.png"))).write(data);
    }
}

let globalWritableMediaStrBuffer = new streamBuffers.WritableStreamBuffer();
let globalReadableMediaStrBuffer = new streamBuffers.ReadableStreamBuffer();
@odata.type(Music)
export class MusicController extends ODataController {
    @odata.GET
    findAll( @odata.context _: ODataHttpContext) {
        let music = new Music();
        music.Id = 1;
        music.Artist = "Dream Theater";
        music.Title = "Six degrees of inner turbulence";
        return [music];
    }

    @odata.GET
    findOne( @odata.key() _: number, @odata.context __: ODataHttpContext) {
        let music = new Music();
        music.Id = 1;
        music.Artist = "Dream Theater";
        music.Title = "Six degrees of inner turbulence";
        return music;
    }

    @odata.GET.$value
    mp3( @odata.key _: number, @odata.context context: ODataHttpContext) {
        globalReadableMediaStrBuffer.put(globalWritableMediaStrBuffer.getContents());
        return globalReadableMediaStrBuffer.pipe(<Writable>context.response);
    }

    @odata.POST.$value
    post( @odata.key _: number, @odata.body upload: Readable) {
        return upload.pipe(globalWritableMediaStrBuffer);
    }
}

@odata.type(Product)
export class ProductsController extends ODataController {
    @odata.GET
    find( @odata.query query: Token) {
        const filter = query && query.value && query.value.options && query.value.options.find(t => t.type == "Filter");
        if (filter){
            return products
                .map((product) => Object.assign({}, product, { _id: product._id.toString(), CategoryId: product.CategoryId && product.CategoryId.toString() }))
                .filter(createFilter(filter));
        }
        (<any>products).inlinecount = products.length;
        return ODataResult.Ok(
            new Promise((resolve, reject) => {
                try {
                    resolve(products);
                } catch (error) {
                    reject(error);
                }
            })
        );
    }

    @odata.GET
    @odata.parameter("key", odata.key)
    findOne(key: string): Product {
        return products.filter(product => product._id.toString() == key)[0] || null;
    }

    @odata.GET('Name')
    @odata.parameter("key", odata.key)
    @odata.parameter("result", odata.result)
    getName(key: string, result: Product): string {
        return result.Name;
    }

    @odata.createRef("Category")
    @odata.updateRef("Category")
    async setCategory( @odata.key key: string, @odata.link('categoryId') link: string): Promise<number> {
        return products.filter(product => {
            if (product._id.toString() === key) {
                product.CategoryId = new ObjectID(link);
                return product;
            }
            return null;
        });
    }

    @odata.deleteRef("Category")
    unsetCategoryId( @odata.key key: string, @odata.link link: string): Promise<number> {
        return new Promise((resolve, reject) => {
            products.filter(product => {
                if (product._id.toString() === key) {
                    product.CategoryId = null;
                    return product;
                }
            });
            resolve(products);
        })
    }
}
ProductsController.enableFilter(ProductsController.prototype.find, 'filter');

@odata.type(Category)
export class CategoriesController extends ODataController {
    @odata.GET
    find( @odata.filter filter: Token): Category[] {
        if (filter) return categories.map((category) => Object.assign({}, category, { _id: category._id.toString() })).filter(createFilter(filter));
        return categories;
    }

    @odata.GET
    @odata.parameters({
        key: odata.key
    })
    findOne(key: string): Category {
        return categories.filter(category => category._id.toString() == key)[0] || null;
    }

    @odata.POST("Products")
    insertProduct( @odata.key key: string, @odata.link link: string, @odata.body body: Product) {
        body._id = new ObjectID('578e1a7c12eaebabec4af23c')
        return ODataResult.Created(new Promise((resolve, reject) => {
            try {
                resolve(body);
            } catch (err) {
                reject(err);
            }
        }));
    }

    @odata.GET("Products").$ref
    @odata.parameter("key", odata.key)
    @odata.parameter("link", odata.link)
    findProduct(key: string, link: string): Product {
        return products.filter(product => product._id.toString() === link);
    }

    @odata.POST("Products").$ref
    @odata.method("PUT", "Products").$ref
    @odata.PATCH("Products").$ref
    *setCategory( @odata.key key: string, @odata.link link: string) {
        yield products.filter(product => {
            if (product._id.toString() === link) {
                product.CategoryId = new ObjectID(key);
                return product;
            }
        });
    }

    @odata.DELETE("Products").$ref
    unsetCategory( @odata.key key: string, @odata.link link: string) {
        return new Promise(resolve => {
            products.filter(product => {
                if (product._id.toString() === link) {
                    product.CategoryId = null;
                    return product;
                }
            });
            resolve(products);
        })
    }
}
CategoriesController.enableFilter('find');

export class CategoryStream extends Category{}
@odata.type(CategoryStream)
@Edm.EntitySet("Categories")
export class CategoriesStreamingController extends ODataController {
    @odata.GET
    find( @odata.filter filter: Token, @odata.stream stream: Writable) {
        let response = [];
        response = categories;
        if (filter) response = categories.map((category) => Object.assign({}, category, { _id: category._id.toString() })).filter(createFilter(filter));
        response.forEach(c => {
            stream.write(c)
        });
        stream.end();
    }

    @odata.GET
    @odata.parameters({
        key: odata.key
    })
    findOne(key: string) {
        return categories.find(category => category._id.toString() == key) || null;
    }

    @odata.GET("Products")
    getProducts( @odata.result result: Category, @odata.stream stream: Writable, @odata.context context: ODataHttpContext) {
        const filteredProducts = products.filter(p => p.CategoryId && p.CategoryId.toString() === result._id.toString());
        filteredProducts.forEach(p => { stream.write(p) });
        stream.end();
    }
}

/**
 *  GENERATOR CONTROLLERS
 */

const toObjectID = _id => _id && !(_id instanceof ObjectID) ? ObjectID.createFromHexString(_id) : _id;

const delay = async function (ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
};

@Edm.Annotate({
    term: "UI.DisplayName",
    string: "Products2"
})
export class Product2 {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Convert(toObjectID)
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product2 identifier"
    }, {
        term: "UI.ControlHint",
        string: "ReadOnly"
    })
    _id:ObjectID

    @Edm.String
    @Edm.Required
    @Edm.Convert(toObjectID)
    CategoryId:ObjectID

    @Edm.ForeignKey("CategoryId")
    @Edm.EntityType(Edm.ForwardRef(() => Category2))
    @Edm.Partner("Products2")
    Category2:Category2

    @Edm.Boolean
    Discontinued:boolean

    @Edm.String
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product2 title"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    Name:string

    @Edm.String
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Product2 English name"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    QuantityPerUnit:string

    @Edm.Decimal
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Unit price of product2"
    }, {
        term: "UI.ControlHint",
        string: "Decimal"
    })
    UnitPrice:number
}

@Edm.OpenType
@Edm.Annotate({
    term: "UI.DisplayName",
    string: "Categories2"
})
export class Category2 {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Deserialize(toObjectID)
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Category2 identifier"
    },
    {
        term: "UI.ControlHint",
        string: "ReadOnly"
    })
    _id:ObjectID

    @Edm.String
    Description:string

    @Edm.String
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Category2 name"
    },
    {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    Name:string

    @Edm.ForeignKey("CategoryId")
    @Edm.Collection(Edm.EntityType(Product2))
    @Edm.Partner("Category2")
    Products2:Product2[]

    @Edm.Collection(Edm.String)
    @Edm.Function
    echo(){
        return ["echotest"];
    }
}

@odata.type(Category2)
@Edm.EntitySet("Categories2")
export class CategoriesGeneratorController extends ODataController {
    @odata.GET
    *find( @odata.filter filter: Token, @odata.stream stream: Writable) {
        let response = categories2;
        if (filter) response = yield categories2.map((category) => Object.assign({}, category, { _id: category._id.toString() })).filter(createFilter(filter));
        stream.write({"@odata.count": response.length});
        for (let category of response) {
            stream.write(category);
            yield delay(1);
        };
        stream.end();
    }

    @odata.GET
    @odata.parameters({
        key: odata.key
    })
    *findOne(key: string) {
        return yield categories2.find(category => category._id.toString() === key) || null;
    }

    @odata.GET("Products2")
    *findProduct( @odata.key key: string, @odata.result result: Category2) {
        return yield products2.filter((product) => product.CategoryId && product.CategoryId.toString() === result._id.toString() && product._id.toString() === key.toString());
    }

    @odata.GET("Products2")
    *findProducts( @odata.filter filter: Token, @odata.stream stream: Writable, @odata.result result: Category2) {
        let response = products2.map((product) => Object.assign({}, product, { _id: product._id.toString() }));
        if (filter) response = response.filter(createFilter(filter));
        response = response.filter((product) => product.CategoryId && product.CategoryId.toString() === result._id.toString());
        for (let c of response) {
            stream.write(c);
            yield delay(10);
        }
        stream.end();
    }
}

@odata.type(Product2)
@Edm.EntitySet("Products2")
export class ProductsGeneratorController extends ODataController {
    @odata.GET
    *find( @odata.filter filter: Token, @odata.stream stream: Writable) {
        let response = products2;
        if (filter) response = yield products2
            .map((product) => Object.assign({}, product, { _id: product._id.toString(), CategoryId: product.CategoryId && product.CategoryId.toString() }))
            .filter(createFilter(filter));
        
        for (let category of response) {
            stream.write(category);
            yield delay(1);
        };
        stream.end();
    }

    @odata.GET
    @odata.parameters({
        key: odata.key
    })
    *findOne(key: string) {
        return yield products2.filter(p => p._id.toString() == key)[0] || null;
    }

    @odata.GET("Category2")
    *findCategories( @odata.filter filter: Token, @odata.stream stream: Writable, @odata.result result: any) {
        return yield categories2.filter((c) => c && c._id.toString() === result.CategoryId.toString());
    }
}

@odata.type(ProductPromise)
export class ProductsPromiseGeneratorController extends ODataController {
    @odata.GET
    *find( @odata.filter filter: Token) {
        if (filter) {
            return yield Promise.resolve(products2
                .map((product) => Object.assign({}, product, { _id: product._id.toString() }))
                .filter(createFilter(filter)));
        } else {
            (<any>products2).inlinecount = products2.length;
            return yield Promise.resolve(products2)
        }
    }

    @odata.GET
    @odata.parameters({
        key: odata.key
    })
    *findOne(key: string) {
        return yield Promise.resolve(products2.filter(p => p._id.toString() == key)[0] || null);
    }

    @odata.GET("CategoryPromise")
    *findCategories( @odata.filter filter: Token, @odata.result result: ProductPromise) {
        return yield Promise.resolve(categories2.filter((c) => c && c._id.toString() === result.CategoryId.toString()));
    }
}

@odata.type(CategoryPromise)
export class CategoriesPromiseGeneratorController extends ODataController {
    @odata.GET
    *find( @odata.filter filter: Token) {
        if (filter) {
            return yield Promise.resolve(categories2
                .map((category) => Object.assign({}, category, { _id: category._id.toString() }))
                .filter(createFilter(filter)));
        }

        return yield Promise.resolve(categories2)
    }

    @odata.GET
    @odata.parameters({
        key: odata.key
    })
    *findOne(key: string) {
        return yield Promise.resolve(categories2.find(category => category._id.toString() === key) || null);
    }

    @odata.GET("ProductPromises")
    *findProduct( @odata.key key: string, @odata.result result: CategoryPromise) {
        return yield Promise.resolve(products2.filter((product) => product.CategoryId && product.CategoryId.toString() === result._id.toString() && product._id.toString() === key.toString()));
    }

    @odata.GET("ProductPromises")
    *findProducts( @odata.filter filter: Token, @odata.stream stream: Writable, @odata.result result: CategoryPromise) {
        return yield Promise.resolve(products2.filter((product) => product.CategoryId && product.CategoryId.toString() === result._id.toString()));
    }
}
const getAllProducts = async () => {
    return await products2;
}
const getProductsByFilter = async (filter: Token) => {
    return await products2
        .map((product) => Object.assign({}, product, { _id: product._id.toString(), CategoryId: product.CategoryId && product.CategoryId.toString() }))
        .filter(createFilter(filter));
}
const getProductByKey = async (key: string) => {
    return await products2.find(p => p._id.toString() == key) || null;
}
const getCategoryOfProduct = async (result: GeneratorProduct) => {
    return await categories2.find((c) => c && c._id.toString() === result.CategoryId.toString()) || null;
}
const getCategoryByFilterOfProduct = async (filter: Token, result: GeneratorProduct) => {
    return await categories2
        .filter(c => c._id.toString() === result.CategoryId.toString())
        .map((category) => Object.assign({}, category, { _id: category._id.toString() }))
        .filter(createFilter(filter));
}

@odata.type(GeneratorProduct)
export class ProductsAdvancedGeneratorController extends ODataController {
    @odata.GET
    *find( @odata.filter filter: Token) {
        if (filter) return yield getProductsByFilter(filter);
        return yield getAllProducts();
    }

    @odata.GET
    @odata.parameters({ key: odata.key })
    *findOne(key: string) {
        return yield getProductByKey(key);
    }

    @odata.GET("GeneratorCategory")
    *findCategories( @odata.filter filter: Token, @odata.result result: GeneratorProduct) {
        if(filter) return yield getCategoryByFilterOfProduct(filter, result);
        return yield getCategoryOfProduct(result);
    }
}

const getAllCategories = async () => {
    return await categories2;
}
const getCategoriesByFilter = async (filter: Token) => {
    return await categories2
        .map((category) => Object.assign({}, category, { _id: category._id.toString() }))
        .filter(createFilter(filter));
}
const getCategoryByKey = async (key: string) => {
    return await categories2.find(category => category._id.toString() === key) || null;
}
const getProductOfCategory = async (key: string, result: GeneratorCategory) => {
    return await products2.filter((product) => product.CategoryId && product.CategoryId.toString() === result._id.toString() && product._id.toString() === key.toString());
}
const getProductsOfCategory = async (result: GeneratorCategory) => {
    return await products2.filter((product) => product.CategoryId && product.CategoryId.toString() === result._id.toString());
}
const getProductsByFilterOfCategory = async (filter: Token, result: GeneratorCategory) => {
    return await products2
        .filter(p => p.CategoryId.toString() === result._id.toString())
        .map((product) => Object.assign({}, product, { _id: product._id.toString(), CategoryId: product.CategoryId && product.CategoryId.toString() }))
        .filter(createFilter(filter));
}

@odata.type(GeneratorCategory)
export class CategoriesAdvancedGeneratorController extends ODataController {
    @odata.GET
    *find(@odata.query query: Token, @odata.filter filter: Token) {
        let options = yield processQueries(query);

        let response: Category[] = yield getAllCategories()
        if (filter) response = yield getCategoriesByFilter(filter);

        response = yield doOrderby(response, options);
        response = yield doSkip(response, options);
        response = yield doTop(response, options);

        return response;
    }

    @odata.GET
    @odata.parameters({ key: odata.key })
    *findOne(key: string) {
        return yield getCategoryByKey(key)
    }

    @odata.GET("GeneratorProducts")
    *filterProducts( @odata.query query: Token, @odata.filter filter: Token, @odata.result result: GeneratorCategory) {
        let options = yield processQueries(query);

        let response: GeneratorProduct[] = yield getProductsOfCategory(result);
        if (filter) response = yield getProductsByFilterOfCategory(filter, result);

        response = yield doOrderby(response, options);
        response = yield doSkip(response, options);
        response = yield doTop(response, options);

        return response
    }
}

@Edm.MediaEntity("image/png")
export class Image2 {
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    Id: number

    @Edm.String
    Filename: string

    @Edm.Stream("image/png")
    Data: ODataStream

    @Edm.Stream("image/png")
    Data2: ODataStream
}

@odata.type(Image2)
export class Images2Controller extends ODataController {
    @odata.GET
    entitySet( @odata.query _: Token) {
        let image2 = new Image2();
        image2.Id = 1;
        image2.Filename = "tmp.png";
        return [image2];
    }

    @odata.GET()
    entity( @odata.key() key: number) {
        let image2 = new Image2();
        image2.Id = key;
        image2.Filename = "tmp.png";
        return image2;
    }

    @odata.GET("Data2")
    *getData2( @odata.key _: number, @odata.stream stream: Writable, @odata.context context: ODataHttpContext) {
        return yield new ODataStream(fs.createReadStream(path.join(__dirname, "..", "..", "src", "test", "fixtures", "logo_jaystack.png"))).pipe(context.response);
    }

    @odata.POST("Data2")
    *postData2( @odata.key _: number, @odata.body data: Readable) {
        return yield new ODataStream(fs.createWriteStream(path.join(__dirname, "..", "..", "src", "test", "fixtures", "tmp.png"))).write(data);
    }
}

export class Location {
    @Edm.String
    City: string

    @Edm.String
    Address: string

    constructor(city, address) {
        this.City = city;
        this.Address = address;
    }
}

export class User {
    @Edm.Key
    @Edm.Int32
    Id: number

    @Edm.ComplexType(Location)
    Location: Location

    constructor(id, location) {
        this.Id = id;
        this.Location = location;
    }
}

export class UsersController extends ODataController {
    @odata.GET
    find() {
        return [new User(1, new Location("Budapest", "Virág utca"))];
    }

    @odata.GET
    findOne( @odata.key key: number) {
        return new User(key, new Location("Budapest", "Virág utca"));
    }

    @odata.namespace("Session")
    @Edm.Action
    logout() { }
}

export class DefTest extends ODataEntity { }
DefTest.define({
    id: [Edm.Int32, Edm.Key, Edm.Computed],
    key: Edm.String,
    value: Edm.String
});

export class DefTestController extends ODataController {
    all() {
        return [Object.assign(new DefTest(), {
            id: 1,
            key: 'testkey',
            value: 'testvalue'
        })];
    }
    one(key) {
        return Object.assign(new DefTest(), {
            id: key,
            key: `testkey${key}`,
            value: `testvalue${key}`
        });
    }
}
DefTestController.define(odata.type(DefTest), {
    all: odata.GET,
    one: [odata.GET, {
        key: odata.key
    }]
});

export class HeaderTestEntity {
    @Edm.Int32
    @Edm.Key
    @Edm.Required
    Id: number
}

@odata.type(HeaderTestEntity)
export class HeaderTestEntityController extends ODataController {
    @odata.GET
    findAll( @odata.context ctx: ODataHttpContext, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        ctx.response.status(403);
        return [];
    }

    @odata.GET
    findOneByKeys( @odata.key key: number, @odata.context ctx: ODataHttpContext) {
        ctx.response.sendStatus(500);
        return {};
    }
}

export class UpsertTestEntity {
    @Edm.Int32
    @Edm.Key
    @Edm.Required
    Id: number

    @Edm.String
    name: string

    constructor(id?, name?) {
        this.Id = id;
        this.name = name;
    }
}

@odata.type(UpsertTestEntity)
export class UpsertTestEntityController extends ODataController {
    @odata.GET
    findAll( @odata.context ctx: ODataHttpContext, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return [new UpsertTestEntity(1, 'upsert')];
    }

    @odata.GET
    findOneByKeys( @odata.id id: number, @odata.context ctx: ODataHttpContext) {
        return new UpsertTestEntity(1, 'upsert');
    }

    put( @odata.body body: any) {
        let up = new UpsertTestEntity(1, 'upsert');

        if (body.Id && body.Id === 1) {
            up.name = body.name;
            return null;
        }
        if (body.Id) {
            return new UpsertTestEntity(body.Id, body.name);
        }
        return new UpsertTestEntity(9999, body.name);
    }
}

export class DefTestServer extends ODataServer{}
DefTestServer.define(odata.controller(DefTestController, true));

export class HiddenController extends ODataController { }

@odata.cors
@odata.controller(SyncTestController, "EntitySet")
@odata.controller(GeneratorTestController, "GeneratorEntitySet")
@odata.controller(AsyncTestController, "AsyncEntitySet")
@odata.controller(InlineCountController, "InlineCountEntitySet")
@odata.controller(BoundOperationController, "BoundOperationEntitySet")
@odata.controller(ImagesController, "ImagesControllerEntitySet")
@odata.controller(MusicController, "MusicControllerEntitySet")
@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, true)
@odata.controller(UsersController, true, User)
@odata.controller(HiddenController)
@odata.controller(CategoriesStreamingController, "CategoriesStream")
@odata.controller(CategoriesGeneratorController)
@odata.controller(ProductsGeneratorController)
@odata.controller(ProductsPromiseGeneratorController, "AdvancedProducts")
@odata.controller(CategoriesPromiseGeneratorController, "AdvancedCategories")
@odata.controller(ProductsAdvancedGeneratorController, "GeneratorProducts")
@odata.controller(CategoriesAdvancedGeneratorController, "GeneratorCategories")
@odata.controller(Images2Controller, "Images2ControllerEntitySet")
@odata.controller(HeaderTestEntityController, "HeaderTestEntity")
@odata.controller(UpsertTestEntityController, "UpsertTestEntity")
@odata.container("TestContainer")
export class TestServer extends ODataServer {
    @Edm.ActionImport
    ActionImport() {
        return new Promise((resolve) => {
            setTimeout(resolve);
        });
    }

    @Edm.ActionImport
    ActionImportParams( @Edm.Int32 value: number) {
        if (typeof value != "number") throw new Error("value is not a number!");
    }

    @Edm.FunctionImport(Edm.String)
    FunctionImport( @Edm.Int64 value: number) {
        return `The number is ${value}.`;
    }

    @Edm.FunctionImport(Edm.String)
    FunctionImportMore( @Edm.String message: string, @Edm.Int64 value: number) {
        return `The number is ${value} and your message was ${message}.`;
    }

    @Edm.FunctionImport(Edm.String)
    SetStatusCode( @odata.context ctx: ODataHttpContext) {
        ctx.response.sendStatus(403);
        return `The status code is ${ctx.response.statusCode}`;
    }

    @Edm.ActionImport
    SetStatusCode2( @odata.context ctx: ODataHttpContext) {
        ctx.response.sendStatus(500);
    }
}

serverCache.push(TestServer.create(5005));

@odata.namespace("Authentication")
@odata.controller(UsersController, true)
export class AuthenticationServer extends ODataServer {
    @odata.namespace("Echo")
    @Edm.FunctionImport(Edm.String)
    echo( @Edm.String message: string): string {
        return message;
    }
}

@odata.cors
@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, false)
export class ProductServer extends ODataServer { }
serverCache.push(ProductServer.create(7001));

@odata.cors
@odata.controller(ProductsController, false)
@odata.controller(CategoriesController, true)
export class CategoryServer extends ODataServer { }
serverCache.push(CategoryServer.create(7002));

export class NoServer extends ODataServer { }

process.on("warning", warning => {
    console.log(warning.stack);
});