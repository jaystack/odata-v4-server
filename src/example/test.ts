import * as es from "event-stream";
import { ODataServer, ODataController, odata } from "../lib/index";

class TestController extends ODataController{
    @odata.GET
    find(){
        return [{
            a: 1
        }, {
            b: 2
        }, {
            t: Date.now()
        }];
    }

    @odata.GET
    findOne(@odata.key key:number){
        return {
            id: key,
            t: Date.now()
        };
    }
}

@odata.controller(TestController, true)
export class TestServer extends ODataServer{}

TestServer.execute("/Test/$count", "GET").then((result) => {
    console.log(result);
});

let server = new TestServer();
server.pipe(<any>es.mapSync(data => console.log(data)));

setInterval(() => {
    server.write({
        url: "/Test(" + Math.floor(Math.random() * 1000) + ")",
        method: "GET"
    });
}, 1000);