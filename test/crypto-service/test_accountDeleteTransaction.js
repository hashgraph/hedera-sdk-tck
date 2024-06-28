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

  describe("DeleteAccountId", async function () {
    it("(#1) Deletes an account without a transfer account", async function () {
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

    it("(#2) Deletes an account with no delete account ID", async function () {
      try {
        // Attempt to delete the account without providing the account ID. The network should respond with an ACCOUNT_ID_DOES_NOT_EXIST status.
        const response = await JSONRPCRequest("deleteAccount", {});
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch(err) {
        assert.equal(err.data.status, "ACCOUNT_ID_DOES_NOT_EXIST");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("TransferAccountId", async function () {
    it("(#1) Deletes an account with a transfer account", async function () {
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
      try {
        let _ = await consensusInfoClient.getAccountInfo(accountId);
      } catch (err) {
        assert.equal(err.status._code, 72); // 72 maps to ACCOUNT_DELETED
        return;
      }
      
      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#2) Deletes an account without signing with the account's private key", async function () {
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

    it("(#3) Deletes an account with a transfer account that is the deleted account", async function () {
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

    it("(#4) Deletes an account with a transfer account that is invalid/doesn't exist", async function () {
      try {
        // Attempt to delete the account with a transfer account that is the deleted account. The network should respond with an INVALID_TRANSFER_ACCOUNT_ID status.
        const response = await JSONRPCRequest("deleteAccount", {
          deleteAccountId: accountId,
          transferAccountId: "1000000.0.0",
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
  });

  return Promise.resolve();
});