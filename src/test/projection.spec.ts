/// <reference types="mocha" />
import { ODataServer, ODataController, odata, Edm, ODataMetadataType } from "../lib/index";
import * as request from 'request-promise';
const { expect } = require("chai");

class Address {
    @Edm.String
    City: string

    @Edm.String
    Address: string

    @Edm.String
    Zip: string

    @Edm.Int32
    Nr: number
}

class User {
    @Edm.Key
    @Edm.Int32
    Id: number

    @Edm.ComplexType(Address)
    Address: Address
}

@odata.type(User)
class UsersController extends ODataController{
    @odata.GET
    users(){
        return [{
            Id: 1,
            Address: {
                City: "Gadgetzan",
                Address: "Mean Street",
                Zip: "1234",
                Nr: 1234
            }
        }]
    }
}

@odata.controller(UsersController, true)
class TestServer extends ODataServer{}

describe("OData projection", () => {
    it("should return projected entities when using $select", () => {
        return TestServer.execute("/Users?$select=Id").then(result => expect(result).to.deep.equal({
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users(Id)",
                value: [{
                    "@odata.id": "http://localhost/Users(1)",
                    Id: 1
                }]
            },
            contentType: "application/json",
            elementType: User
        }));
    });

    it("should return projected entities with complex type when using $select", () => {
        return TestServer.execute("/Users?$select=Address").then(result => expect(result).to.deep.equal({
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users(Address)",
                value: [{
                    "@odata.id": "http://localhost/Users(1)",
                    Address: {
                        City: "Gadgetzan",
                        Address: "Mean Street",
                        Zip: "1234",
                        Nr: 1234
                    }
                }]
            },
            contentType: "application/json",
            elementType: User
        }));
    });

    it("should return projected entities with projected complex type when using $select", () => {
        return TestServer.execute("/Users?$select=Address/City").then(result => expect(result).to.deep.equal({
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users(Address/City)",
                value: [{
                    "@odata.id": "http://localhost/Users(1)",
                    Address: {
                        City: "Gadgetzan"
                    }
                }]
            },
            contentType: "application/json",
            elementType: User
        }));
    });

    it("should return projected entities with projected complex type when using $select and odata.metadata=full", () => {
        return TestServer.execute({
            url: "/Users?$select=Address/City,Address/Nr",
            metadata: ODataMetadataType.full
        }).then(result => expect(result).to.deep.equal({
            statusCode: 200,
            body: {
                "@odata.context": "http://localhost/$metadata#Users(Address/City,Address/Nr)",
                value: [{
                    "@odata.id": "http://localhost/Users(1)",
                    "@odata.type": "#Default.User",
                    Address: {
                        "@odata.type": "#Default.Address",
                        City: "Gadgetzan",
                        Nr: 1234,
                        "Nr@odata.type": "#Int32"
                    },
                    "Address@odata.type": "#Default.Address"
                }]
            },
            contentType: "application/json",
            elementType: User
        }));
    });
});