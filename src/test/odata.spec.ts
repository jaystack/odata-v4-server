/// <reference types="mocha" />
import { NoServer, AuthenticationServer } from './test.model';
import { Edm, odata } from "../lib/index";
const { expect } = require("chai");

describe("Code coverage", () => {
    it("should return empty object when no public controllers on server", () => {
        expect(odata.getPublicControllers(NoServer)).to.deep.equal({});
    });

    it("should not allow non-OData methods", () => {
        try {
            NoServer.execute("/dev/null", "MERGE");
            throw new Error("MERGE should not be allowed");
        } catch (err) {
            expect(err.message).to.equal("Method not allowed.");
        }
    });

    it("should throw resource not found error", () => {
        return AuthenticationServer.execute("/Users", "DELETE").then(() => {
            throw new Error("should throw error");
        }, (err) => {
            expect(err.message).to.equal("Resource not found.");
        });
    });
});