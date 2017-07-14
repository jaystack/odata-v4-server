/// <reference types="mocha" />
import { Token } from "odata-v4-parser/lib/lexer";
import { createFilter } from "odata-v4-inmemory";
import { ODataController, ODataServer, ODataProcessor, ODataMethodType, ODataResult, Edm, odata, ODataHttpContext, ODataStream, ODataEntity } from "../lib/index";
import { Product, Category } from "../example/model";
import { Readable, PassThrough, Writable } from "stream";
import { ObjectID } from "mongodb";
const extend = require("extend");
let categories = require("../example/categories");
let products = require("../example/products");
let streamBuffers = require("stream-buffers");

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
@odata.type(Foobar)
export class SyncTestController extends ODataController {
    @odata.GET
    entitySet(/*@odata.query query:Token, @odata.context context:any, @odata.result result:any, @odata.stream stream:ODataProcessor*/) {
        return [{ id: 1, a: 1 }];
    }

    @odata.GET()
    entity( @odata.key() key: number) {
        if (key === 1) return ODataResult.Ok(foobarObj);
        return ODataResult.Ok({ id: key, foo: "bar" });
    }

    @odata.method("POST")
    insert( @odata.body body: any) {
        body.id = 1;
        return body;
    }

    put( @odata.body body: any) {
        body.id = 1;
    }

    patch( @odata.key key: number, @odata.body delta: any) {
        return Object.assign({
            id: key,
            foo: "bar",
            bar: 'foo'
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
        // let fooObj = this.getFoo();
        // if (fooObj.foo) foobarObj.foo = null;
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
                    resolve({ id: key });
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

let globalWritableImgStrBuffer = new streamBuffers.WritableStreamBuffer();
let globalReadableImgStrBuffer = new streamBuffers.ReadableStreamBuffer();
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
        globalReadableImgStrBuffer.put(globalWritableImgStrBuffer.getContents());
        return globalReadableImgStrBuffer.pipe(context.response);
    }

    @odata.POST("Data")
    postData( @odata.key _: number, @odata.body data: any) {
        return data.pipe(globalWritableImgStrBuffer);
    }

    @odata.GET("Data2")
    getData2( @odata.key _: number, @odata.stream stream: Writable, @odata.context context: ODataHttpContext) {
        stream.write({ value: 0 });
        new ODataStream(stream).pipe(globalWritableImgStrBuffer);
        new ODataStream(stream).write(globalReadableImgStrBuffer);
        stream.end();
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
        return globalReadableMediaStrBuffer.pipe(context.response);
    }

    @odata.POST.$value
    post( @odata.key _: number, @odata.body upload: Readable) {
        return upload.pipe(globalWritableMediaStrBuffer);
    }
}

@odata.type(Product)
@Edm.EntitySet("Products")
export class ProductsController extends ODataController {
    @odata.GET
    find( @odata.filter filter: Token): Product[] {
        if (filter) return products.map((product) => Object.assign({}, product, { _id: product._id.toString(), CategoryId: product.CategoryId && product.CategoryId.toString() })).filter(createFilter(filter));
        return products;
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
@Edm.EntitySet("Categories")
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
}

TestServer.create(5005);

@odata.namespace("Authentication")
@odata.controller(UsersController, true)
export class AuthenticationServer extends ODataServer {
    @odata.namespace("Echo")
    @Edm.FunctionImport(Edm.String)
    echo( @Edm.String message: string): string {
        return message;
    }
}

export class NoServer extends ODataServer { }

process.on("warning", warning => {
    console.log(warning.stack);
});