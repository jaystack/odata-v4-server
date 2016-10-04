"use strict";
const odata_1 = require("./odata");
const utils_1 = require("./utils");
class ODataController {
    static on(method, fn, ...keys) {
        let fnName = (fn.name || fn);
        odata_1.odata.method(method)(this.prototype, fnName);
        if (keys && keys.length > 0) {
            fn = this.prototype[fnName];
            let parameterNames = utils_1.getFunctionParameters(fn);
            keys.forEach((key) => {
                odata_1.odata.key()(this.prototype, fnName, parameterNames.indexOf(key));
            });
        }
    }
    static enableFilter(fn, param) {
        let fnName = (fn.name || fn);
        fn = this.prototype[fnName];
        let parameterNames = utils_1.getFunctionParameters(fn);
        odata_1.odata.filter()(this.prototype, fnName, parameterNames.indexOf(param || parameterNames[0]));
    }
}
exports.ODataController = ODataController;
/*export class ODataStreamController<T> extends ODataController{

}

export class ODataMongoDBController<T> extends ODataController implements IODataController<T>{
    provider:MongoDBProvider
    queryOptions:ExpandVisitor

    constructor(context, server){
        super(context, server);
        this.provider = new MongoDBProvider(server.configuration);
        this.queryOptions = this.provider.createQueryOptions(this.context.url);
    }

    get(...keys:any[]):Promise<T[] | T>{
        return this.provider.get<T>(this.collectionName, this.elementType, this.queryOptions, keys);
    }
    post(entity:T):Promise<T>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            return collection.insertOne(entity).then((result) => {
                return new ctr(entity);
            });
        });
    }
    patch(delta:T, ...keys:any[]):Promise<void>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            let keyQuery = MongoDBProvider.createKeyQuery(this.elementType, keys) || {};
            for (let prop in keyQuery){
                delete delta[prop];
            }
            return collection.findOneAndUpdate(keyQuery, { $set: delta }).then((writeOp) => {
                if (writeOp.value == null) throw new ResourceNotFoundError();
            });
        });
    }
    put(update:T, ...keys:any[]):Promise<void>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            let keyQuery = MongoDBProvider.createKeyQuery(this.elementType, keys) || {};
            for (let prop in keyQuery){
                delete update[prop];
            }
            return collection.findOneAndUpdate(keyQuery, update, { returnOriginal: false }).then((writeOp) => {
                if (writeOp.value == null) throw new ResourceNotFoundError();
            });
        });
    }
    delete(...keys:any[]):Promise<void>{
        return this.provider.storage(this.collectionName).then((collection) => {
            let ctr:any = this.elementType;
            let keyQuery = MongoDBProvider.createKeyQuery(this.elementType, keys) || {};
            return collection.remove(keyQuery).then((writeOp) => {
                if (writeOp.result.n != 1) throw new ResourceNotFoundError();
            });
        });
    }
}*/ 
//# sourceMappingURL=controller.js.map