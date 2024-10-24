import { assert } from "chai";

import { JSONRPCRequest } from "../../client.js";
import { setOperator } from "../../setup_Tests.js";
import {
  verifyTokenIsDeleted,
  getNewFungibleTokenId,
} from "../../utils/helpers/token.js";

/**
 * Tests for TokenDeleteTransaction
 */
describe("TokenDeleteTransaction", function () {
  // Tests should not take longer than 30 seconds to fully execute.
  this.timeout(30000);

  // Each test should first establish the network to use, and then teardown the network when complete.
  beforeEach(async function () {
    await setOperator(
      process.env.OPERATOR_ACCOUNT_ID,
      process.env.OPERATOR_ACCOUNT_PRIVATE_KEY,
    );
  });
  afterEach(async function () {
    await JSONRPCRequest("reset");
  });

  describe("Token ID", function () {
    it("(#1) Deletes an immutable token", async function () {
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
      });

      if (response.status === "NOT_IMPLEMENTED") {
        this.skip();
      }
      const tokenId = response.tokenId;

      try {
        const response = await JSONRPCRequest("deleteToken", {
          tokenId: tokenId,
          commonTransactionParams: {
            signers: [process.env.OPERATOR_ACCOUNT_PRIVATE_KEY],
          },
        });
        if (response.status === "NOT_IMPLEMENTED") {
          this.skip();
        }
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#2) Deletes a mutable token", async function () {
      try {
        const tokenId = await getNewFungibleTokenId();

        const response = await JSONRPCRequest("deleteToken", {
          tokenId: tokenId,
          commonTransactionParams: {
            signers: [process.env.OPERATOR_ACCOUNT_PRIVATE_KEY],
          },
        });
        if (response.status === "NOT_IMPLEMENTED") {
          this.skip();
        }

        await verifyTokenIsDeleted(tokenId);
      } catch (err) {
        return;
      }
    });

    it("(#3) Deletes a token that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("deleteToken", {
          tokenId: "123.456.789",
          commonTransactionParams: {
            signers: [process.env.OPERATOR_ACCOUNT_PRIVATE_KEY],
          },
        });
        if (response.status === "NOT_IMPLEMENTED") {
          this.skip();
        }
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#4) Deletes a token with no token ID", async function () {
      try {
        const response = await JSONRPCRequest("deleteToken", {
          tokenId: "",
          commonTransactionParams: {
            signers: [process.env.OPERATOR_ACCOUNT_PRIVATE_KEY],
          },
        });
        if (response.status === "NOT_IMPLEMENTED") {
          this.skip();
        }
      } catch (err) {
        assert.equal(err.message, "Internal error");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#5) Deletes a token that was already deleted", async function () {
      try {
        const tokenId = await getNewFungibleTokenId();

        await JSONRPCRequest("deleteToken", {
          tokenId: tokenId,
          commonTransactionParams: {
            signers: [process.env.OPERATOR_ACCOUNT_PRIVATE_KEY],
          },
        });

        // Trying to delete a token once again
        const response = await JSONRPCRequest("deleteToken", {
          tokenId: tokenId,
          commonTransactionParams: {
            signers: [process.env.OPERATOR_ACCOUNT_PRIVATE_KEY],
          },
        });

        if (response.status === "NOT_IMPLEMENTED") {
          this.skip();
        }
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_WAS_DELETED");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#6) Deletes a token without signing with the token's admin key", async function () {
      try {
        // Passing other admin key in order to throw an error
        const privateKey = await JSONRPCRequest("generateKey", {
          type: "ed25519PrivateKey",
        });

        const tokenId = await getNewFungibleTokenId(privateKey.key);

        const response = await JSONRPCRequest("deleteToken", {
          tokenId: tokenId,
        });

        if (response.status === "NOT_IMPLEMENTED") {
          this.skip();
        }
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#7) Deletes a token but signs with an incorrect private key", async function () {
      try {
        const privateKey = await JSONRPCRequest("generateKey", {
          type: "ed25519PrivateKey",
        });

        // Creating an account to use its accountId for creating the token
        // and after that signing it with different private key
        const createdAccount = await JSONRPCRequest("createAccount", {
          key: privateKey.key,
        });

        const tokenId = await getNewFungibleTokenId(
          process.env.OPERATOR_ACCOUNT_PRIVATE_KEY,
          createdAccount.accountId,
        );

        // Trying to delete a token once again
        const response = await JSONRPCRequest("deleteToken", {
          tokenId: tokenId,
          commonTransactionParams: {
            signers: [process.env.OPERATOR_ACCOUNT_PRIVATE_KEY],
          },
        });

        if (response.status === "NOT_IMPLEMENTED") {
          this.skip();
        }
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  return Promise.resolve();
});
