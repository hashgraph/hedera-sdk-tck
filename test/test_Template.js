import { JSONRPCRequest } from "../client.js";
import { AccountId } from "@hashgraph/sdk";
import axios from "axios";
import consensusInfoClient from "../consensusInfoClient.js";
import { setOperator } from "../setup_Tests.js";
import { assert } from "chai";

/**
 * Explain what this test suite is for here
 */
describe.skip("Hedera functionality we want to test", function () {
  // a suite of tests
  this.timeout(30000); // Timeout for all tests and hooks within this suite

  // before and after hooks (normally used to set up and reset the client SDK)
  before(async function () {
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);
  });
  after(async function () {
    await JSONRPCRequest("reset");
  });

  // Before/after each test can also be used
  beforeEach(function () {});
  afterEach(function () {});

  describe("Test section name here", function () {
    it("should do something successfully", async function () {
      // 1. Call JSON-RPC (Make sure it is running first)
      let response = await JSONRPCRequest("doSomething", {
        parameter: "value",
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      let accountId = new AccountId(response.accountId).toString();

      // Get value using Client SDK (Don't use JSON-RPC)
      const respSDK = consensusInfoClient.getAccountInfo(accountId); //from SDKEnquiry.js
      // or setup execute method using SDK Client manually here

      // Get value using Mirror node (optional)
      // add delay here to give mirror node time to update
      let url = `${process.env.MIRROR_NODE_REST_URL}/api/v1/accounts?account.id=${accountId}`;
      const fetchedResponse = await axios.get(url);
      const respJSON = fetchedResponse.data;

      // Check if something was successfully completed
      expect(respSDK).to.equal("value");
      expect(respJSON).to.equal("value");
    });

    // Another test in the same suite
    it("should try to do something but fail and check error code", async function () {
      try {
        // 1. Call JSON-RPC (Make sure it is running first)
        let response = await JSONRPCRequest("doSomethingExpectingError", {
          parameter: "value",
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        // check if correct error status is thrown
        // custom hedera errors codes can be found here:
        // https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto
        assert.equal(err.data.status, "INVALID_TRANSACTION");
        return;
      }
      assert.fail("Should throw an error");
    });
  });
});
