import { JSONRPCRequest } from "../../client.js";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { expect, assert } from "chai";
import { setOperator } from "../../setup_Tests.js";

describe("AccountUpdateTransaction", function () {
  // Tests should not take longer than 30 seconds to fully execute.
  this.timeout(30000);

  // An account is created for each test. These hold the information for that account.
  let accountPrivateKey, accountId, accountInfoConsensus, accountInfoMirror;
  
  beforeEach(async function () {
    // Initialize the network and operator.
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);

    // Generate a private key.
    let response = await JSONRPCRequest("generatePrivateKey", {
      type: "privateKey"
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    accountPrivateKey = response.key;

    // Create an account using the generated private key.
    response = await JSONRPCRequest("createAccount", {
      key: accountPrivateKey
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    accountId = response.accountId;

    // Grab the initial account information.
    accountInfoConsensus = await consensusInfoClient.getAccountInfo(accountId);
    accountInfoMirror = await mirrorNodeClient.getAccountData(accountId).accounts[0];
  });

  afterEach(async function () {
    await JSONRPCRequest("reset");
  });

  describe("AccountId", function () {
    it("(#1) Updates an account with no updates", async function () {
      // Attempt to update the account.
      const response = await JSONRPCRequest("updateAccount", {
        accountId: caccountId,
        commonTransactionParams: {
          signers: [
            accountPrivateKey.key
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Account info should remain the same
      expect(await mirrorNodeClient.getAccountData(accountId).accounts[0]).to.be.equal(accountInfoMirror);
      expect(await consensusInfoClient.getAccountInfo(accountId)).to.be.equal(accountInfoConsensus)
    });

    it("(#2) Updates an account with no updates without signing with the account's private key", async function () {
      try {
        // Attempt to update the account without signing with the account's private key. The network should respond with an INVALID_SIGNATURE status.
        const response = await JSONRPCRequest("updateAccount", {
          accountId: accountId
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch(err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#3) Updates an account with no account ID", async function () {
      try {
        // Attempt to update the account without providing the account ID. The network should respond with an INVALID_ACCOUNT_ID status.
        const response = await JSONRPCRequest("updateAccount", {});
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch(err) {
        assert.equal(err.data.status, "INVALID_ACCOUNT_ID");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("Key", function () {
    async function verifyNewAccountKey(key) {
      expect(key).to.be.equal(await consensusInfoClient.getAccountInfo(accountId).key.toString());
      expect(key).to.be.equal()
      const newAccountInfoMirror = await mirrorNodeClient.getAccountData(accountId).accounts[0];
    }

    it("(#1) Updates an account with a new valid ED25519 public key", async function () {
      // Generate a new ED25519 public key for the account.
      const ed25519PublicKey = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (ed25519PublicKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to update the key of the account with the new ED25519 public key.
      const response = await JSONRPCRequest("updateAccount", {
        accountId: accountId,
        key: ed25519PublicKey.key,
        commonTransactionParams: {
          signers: [
            accountPrivateKey
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      
    });
  });

  return Promise.resolve();
});