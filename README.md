# JayStack OData V4 Server

OData V4 server for node.js

## Features

* OASIS Standard OData Version 4.0 server
* usable as a standalone server, as an Express router, as a node.js stream or as a library
* expose service document and service metadata - $metadata
* setup metadata using decorators or [metadata JSON](https://github.com/jaystack/odata-v4-service-metadata)
* supported data types are Edm primitives, complex types, navigation properties
* support create, read, update, and delete entity sets, action imports, function imports, collection and entity bound actions and functions
* support for full OData query language using [odata-v4-parser](https://github.com/jaystack/odata-v4-parser)
  * filtering entities - $filter
  * sorting - $orderby
  * paging - $skip and $top
  * projection of entities - $select
  * expanding entities - $expand
  * $count
* support sync and async controller functions
* support async controller functions using Promise, async/await or ES6 generator functions
* support result streaming
* support media entities

## Controller and server functions parameter injection decorators

* @odata.key
* @odata.filter
* @odata.query
* @odata.context
* @odata.body
* @odata.result
* @odata.stream

## Example Northwind server

```typescript
export class ProductsController extends ODataController{
    @odata.GET
    find(@odata.filter filter:ODataQuery){
        if (filter) return products.filter(createFilter(filter));
        return products;
    }

    @odata.GET
    findOne(@odata.key key:string){
        return products.filter(product => product._id == key)[0];
    }

    @odata.POST
    insert(@odata.body product:any){
        product._id = new ObjectID().toString();
        products.push(product);
        return product;
    }

    @odata.PATCH
    update(@odata.key key:string, @odata.body delta:any){
        let product = products.filter(product => product._id == key)[0];
        for (let prop in delta){
            product[prop] = delta[prop];
        }
    }

    @odata.DELETE
    remove(@odata.key key:string){
        products.splice(products.indexOf(products.filter(product => product._id == key)[0]), 1);
    }
}

export class CategoriesController extends ODataController{
    @odata.GET
    find(@odata.filter filter:ODataQuery){
        if (filter) return categories.filter(createFilter(filter));
        return categories;
    }

    @odata.GET
    findOne(@odata.key key:string){
        return categories.filter(category => category._id == key)[0];
    }

    @odata.POST
    insert(@odata.body category:any){
        category._id = new ObjectID().toString();
        categories.push(category);
        return category;
    }

    @odata.PATCH
    update(@odata.key key:string, @odata.body delta:any){
        let category = categories.filter(category => category._id == key)[0];
        for (let prop in delta){
            category[prop] = delta[prop];
        }
    }

    @odata.DELETE
    remove(@odata.key key:string){
        categories.splice(categories.indexOf(categories.filter(category => category._id == key)[0]), 1);
    }
}

@odata.cors
@odata.controller(ProductsController, true)
@odata.controller(CategoriesController, true)
export class NorthwindODataServer extends ODataServer{}
NorthwindODataServer.create("/odata", 3000);
```
