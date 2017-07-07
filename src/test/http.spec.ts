/// <reference types="mocha" />
import { ODataServer } from "../lib/index";
import { testFactory } from './server.spec'
import * as request  from 'request'
const { expect } = require("chai");

function createTest(testcase: string, server: typeof ODataServer, command: string, compare: any, body?: any) {
    it(`${testcase} (${command})`, () => {
        let test = command.split(" ");
        let method = test[0].toLowerCase();
        let path = test.slice(1).join(" ");
        let port = 3000;
        server.create(port);
        request[method](`http://localhost:${port}${path}`, body, (err, response, result) => {
            if (err) { console.log(err); }
            expect(result).to.deep.equal(compare);
        })
    });
}

describe("Odata http", () =>{
    testFactory(createTest);
})
