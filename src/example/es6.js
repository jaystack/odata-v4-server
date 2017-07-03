const { ODataServer, ODataController, ODataEntity, odata, Edm } = require('../lib');

class ES6Type extends ODataEntity{}
ES6Type.define({
    id: [Edm.Int32, Edm.Key, Edm.Computed],
    key: Edm.String,
    value: Edm.String
});

class ES6Controller extends ODataController{
    all(){
        return [Object.assign(new ES6Type(), {
            id: 1,
            key: 'almafa',
            value: 'kiscica'
        })];
    }
    one(key){
        return Object.assign(new ES6Type(), {
            id: key,
            key: 'almafa2',
            value: 'kiscica2'
        });
    }
}
ES6Controller.define(odata.type(ES6Type), {
    all: odata.GET,
    one: [odata.GET, {
        key: odata.key
    }]
});

class ES6Server extends ODataServer{}
ES6Server.define(odata.controller(ES6Controller, true));
ES6Server.create(3000);

console.log('ES6 OData server listening on port: 3000');