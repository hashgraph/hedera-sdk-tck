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
        accountId: accountId,
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
      // If the account was updated successfully, the queried account keys should be equal.
      expect(key).to.be.equal(await consensusInfoClient.getAccountInfo(accountId).key.toStringDer().toLowerCase());
      expect(key).to.be.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].key.key.toLowerCase());
    }

    it("(#1) Updates an account with a new valid ED25519 public key", async function () {
      // Generate a new ED25519 private key for the account.
      const ed25519PrivateKey = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (ed25519PrivateKey.status === "NOT_IMPLEMENTED") this.skip();

      // Generate the corresponding ED25519 public key.
      const ed25519PublicKey = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: ed25519PrivateKey.key
      });
      if (ed25519PublicKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to update the key of the account with the new ED25519 public key.
      const response = await JSONRPCRequest("updateAccount", {
        accountId: accountId,
        key: ed25519PublicKey.key,
        commonTransactionParams: {
          signers: [
            accountPrivateKey,
            ed25519PrivateKey.key
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account key was updated (use raw key for comparison, ED25519 public key DER-encoding has a 12 byte prefix).
      verifyNewAccountKey(String(ed25519PublicKey.key).substring(24).toLowerCase());
    });

    it("(#2) Updates an account with a new valid ECDSAsecp256k1 public key", async function () {
      // Generate a new ECDSAsecp256k1 private key for the account.
      const ecdsaSecp256k1PrivateKey = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (ecdsaSecp256k1PrivateKey.status === "NOT_IMPLEMENTED") this.skip();

      // Generate the corresponding ECDSAsecp256k1 public key.
      const ecdsaSecp256k1PublicKey = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: ecdsaSecp256k1PrivateKey.key
      });
      if (ecdsaSecp256k1PublicKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to update the key of the account with the new ECDSAsecp256k1 public key.
      const response = await JSONRPCRequest("updateAccount", {
        accountId: accountId,
        key: ecdsaSecp256k1PublicKey.key,
        commonTransactionParams: {
          signers: [
            accountPrivateKey,
            ecdsaSecp256k1PrivateKey.key
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account key was updated (use raw key for comparison, compressed ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix).
      verifyNewAccountKey(String(ecdsaSecp256k1PublicKey.key).substring(28).toLowerCase());
    });

    it("(#3) Updates an account with a new valid ED25519 private key", async function () {
      // Generate a new ED25519 private key for the account.
      const ed25519PrivateKey = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (ed25519PrivateKey.status === "NOT_IMPLEMENTED") this.skip();

      // Generate the corresponding ED25519 public key.
      const ed25519PublicKey = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: ed25519PrivateKey.key
      });
      if (ed25519PublicKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to update the key of the account with the new ED25519 private key.
      const response = await JSONRPCRequest("updateAccount", {
        accountId: accountId,
        key: ed25519PrivateKey.key,
        commonTransactionParams: {
          signers: [
            accountPrivateKey,
            ed25519PrivateKey.key
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account key was updated (use raw key for comparison, ED25519 public key DER-encoding has a 12 byte prefix).
      verifyNewAccountKey(String(ed25519PublicKey.key).substring(24).toLowerCase());
    });

    it("(#4) Updates an account with a new valid ECDSAsecp256k1 private key", async function () {
      // Generate a new ECDSAsecp256k1 private key for the account.
      const ecdsaSecp256k1PrivateKey = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (ecdsaSecp256k1PrivateKey.status === "NOT_IMPLEMENTED") this.skip();

      // Generate the corresponding ECDSAsecp256k1 public key.
      const ecdsaSecp256k1PublicKey = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: ecdsaSecp256k1PrivateKey.key
      });
      if (ecdsaSecp256k1PublicKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to update the key of the account with the new ECDSAsecp256k1 public key.
      const response = await JSONRPCRequest("updateAccount", {
        accountId: accountId,
        key: ecdsaSecp256k1PrivateKey.key,
        commonTransactionParams: {
          signers: [
            accountPrivateKey,
            ecdsaSecp256k1PrivateKey.key
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account key was updated (use raw key for comparison, compressed ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix).
      verifyNewAccountKey(String(ecdsaSecp256k1PublicKey.key).substring(28).toLowerCase());
    });

    it("(#4) Updates an account with a new valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys", async function () {
      // Generate a KeyList of ED25519 and ECDSAsecp256k1 private and public keys for the account.
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {},
          {},
          {}
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to update the key of the account with the new KeyList of ED25519 and ECDSAsecp256k1 private and public keys.
      const response = await JSONRPCRequest("updateAccount", {
        accountId: accountId,
        key: keyList.key,
        commonTransactionParams: {
          signers: [
            accountPrivateKey,
            keyList.key
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account key was updated (use raw key for comparison, compressed ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix).
      verifyNewAccountKey(String(ecdsaSecp256k1PublicKey.key).substring(28).toLowerCase());
    });
  });

  return Promise.resolve();
});