import { JSONRPCRequest } from "../../client.js";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { expect, assert } from "chai";
import { setOperator } from "../../setup_Tests.js";

describe("AccountDeleteTransaction", function () {
  // Tests should not take longer than 30 seconds to fully execute.
  this.timeout(30000);

  // An account is created for each test. These hold the information for that account.
  let accountPrivateKey, accountId;

  beforeEach(async function () {
    // Initialize the network and operator.
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);

    // Generate a private key.
    let response = await JSONRPCRequest("generateKey", {
      type: "ed25519PrivateKey"
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    accountPrivateKey = response.key;

    // Create an account using the generated private key.
    response = await JSONRPCRequest("createAccount", {
      key: accountPrivateKey
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    accountId = response.accountId;
  });
  afterEach(async function () {
    await JSONRPCRequest("reset");
  });

  describe("Delete Account Id", async function () {
    it("(#1) Deletes an account with no transfer account", async function () {
      try {
        // Attempt to delete the account without a transfer account. The network should respond with an ACCOUNT_ID_DOES_NOT_EXIST status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "ACCOUNT_ID_DOES_NOT_EXIST");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#2) Deletes an account with no delete account", async function () {
      try {
        // Attempt to delete the account without a delete account. The network should respond with an ACCOUNT_ID_DOES_NOT_EXIST status.
        const response = await JSONRPCRequest("deleteAccount", {
          transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "ACCOUNT_ID_DOES_NOT_EXIST");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#3) Deletes an admin account", async function () {
      try {
        // Attempt to delete an admin account. The network should respond with an ENTITY_NOT_ALLOWED_TO_DELETE status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: "0.0.2",
          transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch(err) {
        assert.equal(err.data.status, "ENTITY_NOT_ALLOWED_TO_DELETE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#4) Deletes an account that doesn't exist", async function () {
      try {
        // Attempt to delete an account that doesn't exist. The network should respond with an INVALID_ACCOUNT_ID status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: "123.456.789",
          transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch(err) {
        assert.equal(err.data.status, "INVALID_ACCOUNT_ID");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#5) Deletes an account that was already deleted", async function () {
      // Delete the account first.
      var response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: accountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
          signers: [
            accountPrivateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to delete the account again. The network should respond with an ACCOUNT_DELETED status.
        response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
      } catch(err) {
        assert.equal(err.data.status, "ACCOUNT_DELETED");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#6) Deletes an account without signing with the account's private key", async function () {
      try {
        // Attempt to delete the account without signing with the account's private key. The network should respond with an INVALID_SIGNATURE status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          transferAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch(err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#7) Deletes an account but signs with an incorrect private key", async function () {
      // Generate a private key.
      let key = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to delete the account and sign with an incorrect private key. The network should respond with an INVALID_SIGNATURE status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
          commonTransactionParams: {
            signers: [
              key.key
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch(err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("Transfer Account Id", async function () {
    it("(#1) Deletes an account with a valid transfer account", async function () {
      // Attempt to delete the account and transfer its funds to the operator account.
      const response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: accountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
          signers: [
            accountPrivateKey
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Only look at the consensus node here because the mirror node data can be populated yet still take a couple seconds to fully update.
      // AccountInfoQuery throws if the account is deleted, so catch that and verify the status code maps correctly.
      try {
        let _ = await consensusInfoClient.getAccountInfo(accountId);
      } catch (err) {
        assert.equal(err.status._code, 72); // 72 maps to ACCOUNT_DELETED
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#2) Deletes an account with a transfer account that is the deleted account", async function () {
      try {
        // Attempt to delete the account with a transfer account that is the deleted account. The network should respond with an TRANSFER_ACCOUNT_SAME_AS_DELETE_ACCOUNT status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          transferAccountId: accountId,
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TRANSFER_ACCOUNT_SAME_AS_DELETE_ACCOUNT");
        return;
      }
  
      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#3) Deletes an account with a transfer account that is invalid/doesn't exist", async function () {
      try {
        // Attempt to delete the account with a transfer account that is the deleted account. The network should respond with an INVALID_TRANSFER_ACCOUNT_ID status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          transferAccountId: "123.456.789",
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TRANSFER_ACCOUNT_ID");
        return;
      }
    
      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#4) Deletes an account with a transfer account that is a deleted account", async function () {
      // Generate a key.
      var response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      let key = response.key

      // Create an account with the key.
      response = await JSONRPCRequest("createAccount", {
        key: key
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      let deletedAccountId = response.accountId;

      // Delete the account.
      response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: deletedAccountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
          signers: [
            key
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to delete the account with the deleted account as the transfer account. The network should respond with an ACCOUNT_DELETED status.
        response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          transferAccountId: deletedAccountId,
          commonTransactionParams: {
            signers: [
              accountPrivateKey
            ]
          }
        });
      } catch(err) {
        assert.equal(err.data.status, "ACCOUNT_DELETED");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  return Promise.resolve();
});
