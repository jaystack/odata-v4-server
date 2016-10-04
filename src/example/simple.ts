import { ObjectID } from "mongodb";
import { Token } from "odata-v4-parser/lib/lexer";
import { FilterVisitor } from "odata-v4-inmemory/lib/FilterVisitor";
import * as extend from "extend";
import { odata, ODataController, ODataServer, createODataServer } from "../index";
let categories = require("./categories");
let products = require("./products");

export class ProductsController extends ODataController{
    @odata.GET()
    find(@odata.filter() filter:Token){
        if (filter){
            let filterFn = new FilterVisitor().Visit(filter, {});
            return products.map((product) => {
                product._id = product._id.toString();
                product.CategoryId = product.CategoryId.toString();
                return product;
            }).filter((product) => filterFn(product)).map(product => product);
        }
        return products.map(product => product);
    }

    @odata.GET()
    findOne(@odata.key() key:string){
        let product = products.filter(product => product._id.toString() == key)[0];
        return product ? product : null;
    }

    @odata.POST()
    insert(@odata.body() product:any){
        product._id = new ObjectID();
        products.push(product);
        return product;
    }

    @odata.PATCH()
    update(@odata.key() key:string, @odata.body() delta:any){
        let product = products.filter(product => product._id.toString() == key)[0];
        extend(product, delta);
    }
}

export class CategoriesController extends ODataController{
    @odata.GET()
    find(@odata.filter() filter:Token){
        if (filter){
            let filterFn = new FilterVisitor().Visit(filter, {});
            return categories.map((category) => {
                category._id = category._id.toString();
                return category;
            }).filter((category) => filterFn(category));
        }
        return categories;
    }

    @odata.GET()
    findOne(@odata.key() key:string){
        let category = categories.filter(category => category._id.toString() == key)[0];
        return category || null;
    }

    @odata.POST()
    insert(@odata.body() category:any){
        category._id = new ObjectID();
        categories.push(category);
        return category;
    }

    @odata.PATCH()
    update(@odata.key() key:string, @odata.body() delta:any){
        let category = categories.filter(category => category._id.toString() == key)[0];
        extend(category, delta);
    }
}

@odata.cors()
@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, true)
export class NorthwindODataServer extends ODataServer{}

createODataServer(NorthwindODataServer, "/odata", 3000);