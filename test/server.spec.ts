import "mocha";
import { expect } from "chai";
import { ODataController, ODataServer, odata } from "../lib/index";

class TestController1 extends ODataController{
    @odata.GET
    entitySet(){
        return [{ a: 1 }];
    }

    @odata.GET
    entity(@odata.key key:number){
        return { id: key };
    }
}

class TestController2 extends ODataController{
    @odata.GET
    *entitySet(){
        return [{ a: 1 }];
    }
}

@odata.controller(TestController1, "EntitySet")
@odata.controller(TestController2, "EntitySet2")
class TestServer extends ODataServer{}

function createTest(testcase:string, server:typeof ODataServer, command:string, compare:any, body?:any){
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        return server.execute(test[1], test[0]).then((result) => {
            expect(JSON.stringify(result)).to.equal(JSON.stringify(compare));
        });
    });
}

describe("ODataServer", () => {
    createTest("should return entity set result", TestServer, "GET /EntitySet", {
        statusCode: 200,
        body: {
            "@odata.context": "http://localhost/$metadata#EntitySet",
            value: [{ a: 1 }]
        },
        contentType: "application/json"
    });

    createTest("should return entity set result using generator function", TestServer, "GET /EntitySet2", {
        statusCode: 200,
        body: {
            "@odata.context": "http://localhost/$metadata#EntitySet2",
            value: [{ a: 1 }]
        },
        contentType: "application/json"
    });

    createTest("should return entity by key", TestServer, "GET /EntitySet(1)", {
        statusCode: 200,
        body: {
            "@odata.context": "http://localhost/$metadata#EntitySet/$entity",
            id: 1
        },
        contentType: "application/json"
    });
});