/// <reference types="mocha" />
import { ODataServer } from "../lib/index";
import { testFactory } from './server.spec'
const { expect } = require("chai");

function createTest(testcase: string, server: typeof ODataServer, command: string, compare: any, body?: any) {
    let test = command.split(" ");
    let method = test[0].toLowerCase();
    let path = test.slice(1).join(" ");
    let testServer = new server();
    it(`${testcase} (${command})`, () => {

        let context: any = {};
        context.url = path;
        context.method = method;
        context.body = body;

        return new Promise((resolve, reject) => {
            testServer.write(context);
            testServer.on("data", data => {
                resolve(data)
            })
            testServer.on("error", err => {
                reject(err)
            })
        }).then(result => {
            expect(result).to.deep.equal(compare);
        })
    });
}

describe("OData stream", () => {
    testFactory(createTest);
});