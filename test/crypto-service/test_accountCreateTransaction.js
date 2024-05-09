import { JSONRPCRequest } from "../../client.js";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { generateAccountKeys, setOperator, getNodeType } from "../../setup_Tests.js";
import { EvmAddress } from "@hashgraph/sdk";
import crypto from "crypto";
import { assert, expect } from "chai";
import { JSONRPC } from "json-rpc-2.0";

/**
 * Tests for AccountCreateTransaction
 */
describe("AccountCreateTransaction", function () {  
  // Tests should not take longer than 30 seconds to fully execute.
  this.timeout(30000);

  // Each test should first establish the network to use, and then teardown the network when complete.
  beforeEach(async function () {
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);
  });
  afterEach(async function () {
    await JSONRPCRequest("reset");
  });

  describe("Key", function () {
    async function verifyOnlyAccountCreation(accountId) {
      // If the account was created successfully, the queried account's IDs should be equal.
      expect(accountId).to.equal(await consensusInfoClient.getAccountInfo(accountId).accountId.toString());
      expect(accountId).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].account);
    }

    it("(#1) Creates an account with a valid ED25519 public key", async function () {
      // Generate an ED25519 public key for the account.
      const ed25519PublicKey = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (ed25519PublicKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account.
      const response = await JSONRPCRequest("createAccount", {
        key: ed25519PublicKey.key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created.
      verifyOnlyAccountCreation(response.accountId);
    });

    it("(#2) Creates an account with a valid ECDSAsecp256k1 public key", async function () {
      // Generate an ECDSAsecp256k1 public key for the account.
      const ecdsaSecp256k1PublicKey = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (ecdsaSecp256k1PublicKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account.
      const response = await JSONRPCRequest("createAccount", {
        key: ecdsaSecp256k1PublicKey.key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created.
      verifyOnlyAccountCreation(response.accountId);
    });

    it("(#3) Creates an account with a valid ED25519 private key", async function () {
      // Generate an ED25519 private key for the account.
      const ed25519PrivateKey = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (ed25519PrivateKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account.
      const response = await JSONRPCRequest("createAccount", {
        key: ed25519PrivateKey.key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created.
      verifyOnlyAccountCreation(response.accountId);
    });

    it("(#4) Creates an account with a valid ECDSAsecp256k1 private key", async function () {
      // Generate an ECDSAsecp256k1 private key for the account.
      const ecdsaSecp256k1PrivateKey = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (ecdsaSecp256k1PrivateKey.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account.
      const response = await JSONRPCRequest("createAccount", {
        key: ecdsaSecp256k1PrivateKey.key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created.
      verifyOnlyAccountCreation(response.accountId);
    });

    it("(#5) Creates an account with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys", async function () {
      // Generate a KeyList of ED25519 and ECDSAsecp256k1 private and public keys for the account.
      const keyList = await JSONRPCRequest("generateKey", {
        keys: [
          {},
          {},
          {}
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account.
      const response = await JSONRPCRequest("createAccount", {
        key: keyList.key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created.
      verifyOnlyAccountCreation(response.accountId);
    });

    it("(#6) Creates an account with a valid KeyList of nested Keylists (three levels)", async function () {
      // Generate a KeyList of nested KeyLists of ED25519 and ECDSAsecp256k1 private and public keys for the account.
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        keys: [
          {
            keys: [
              {},
              {}
            ]
          },
          {
            keys: [
              {},
              {}
            ]
          },
          {
            keys: [
              {},
              {}
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account.
      const response = await JSONRPCRequest("createAccount", {
        key: nestedKeyList.key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created.
      verifyOnlyAccountCreation(response.accountId);
    });

    it("(#7) Creates an account with no key", async function () {
      try {
        // Attempt to create an account without providing a key. The network should respond with a KEY_REQUIRED status.
        const response = await JSONRPCRequest("createAccount", {});
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "KEY_REQUIRED");
        return;
      }

      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
    
    it("(#8) Creates an account with an invalid key", async function () {
      try {        
        // Attempt to create an account with an invalid key (random 88 bytes, which is equal to the byte length of a valid public key). The SDK should throw an internal error.
        const response = await JSONRPCRequest("createAccount", {
          key: crypto.randomBytes(88).toString()
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
  });

  describe("Initial Balance", function () {
    async function verifyAccountCreationWithInitialBalance(accountId, initialBalance) {
      // If the account was created successfully, the queried account's balances should be equal.
      expect(initialBalance).to.equal(Number(await consensusInfoClient.getAccountInfo(accountId).balance._valueInTinybar));
      expect(initialBalance).to.equal(Number(await mirrorNodeClient.getBalanceData(accountId).balances[0].balance));
    }

    it("(#1) Creates an account with an initial balance", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      // Attempt to create an account with an initial balance of 100 tinybars.
      const initialBalance = 100;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        initialBalance: initialBalance,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created with 100 tinybars.
      verifyAccountCreationWithInitialBalance(response.accountId, initialBalance);
    });
    
    it("(#2) Creates an account with no initial balance", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      // Attempt to create an account with an initial balance of 0 tinybars.
      const initialBalance = 0;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        initialBalance: 0,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Verify the account was created with 0 tinybars.
      verifyAccountCreationWithInitialBalance(response.accountId, initialBalance);
    });

    it("(#3) Creates an account with a negative initial balance", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with an initial balance of -1. The network should respond with an INVALID_INITIAL_BALANCE status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          initialBalance: -1,
        });
        if (response.status == "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_INITIAL_BALANCE");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
    
    it("(#4) Creates an account with an initial balance higher than the operator account balance", async function () {
      // Get the operator account balance.
      const operatorAccountBalance = await mirrorNodeClient.getBalanceData(process.env.OPERATOR_ACCOUNT_ID).balances[0].balance;

      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with an initial balance of the operator account balance + 1. The network should respond with an INSUFFICIENT_PAYER_BALANCE status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          initialBalance: operatorAccountBalance + 1,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INSUFFICIENT_PAYER_BALANCE");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
  });

  describe("Receiver Signature Required", function () {
    async function verifyAccountCreationWithReceiverSignatureRequired(accountId, receiverSignatureRequired) {
      // If the account was created successfully, the queried account's receiver signature required policies should be equal.
      expect(receiverSignatureRequired).to.equal(await consensusInfoClient.getAccountInfo(accountId).isReceiverSignatureRequired);
      expect(receiverSignatureRequired).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].receiver_sig_required);
    }

    it("(#1) Creates an account that requires a receiving signature", async function () {
      // Generate a valid private key for the account.
      const key = await JSONRPCRequest("generateKey", {
        type: "privateKey"
      });
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account that requires a signature when receiving.
      const receiverSignatureRequired = true;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        receiverSignatureRequired: receiverSignatureRequired,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithReceiverSignatureRequired(response.accountId, receiverSignatureRequired);
    });

    it("(#2) Creates an account that doesn't require a receiving signature", async function () {
      // Generate a valid private key for the account.
      const key = await JSONRPCRequest("generateKey", {
        type: "privateKey"
      });
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account that doesn't require a signature when receiving.
      const receiverSignatureRequired = false;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        receiverSignatureRequired: receiverSignatureRequired,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithReceiverSignatureRequired(response.accountId, receiverSignatureRequired);
    });

    it("(#3) Creates an account that requires a receiving signature but isn't signed by the account key", async function () {
      // Generate a valid public key for the account.
      const key = await JSONRPCRequest("generateKey", {
        type: "publicKey"
      });
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account that requires a signature when receiving but can't be signed. The network should respond with an INVALID_SIGNATURE status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          receiverSignatureRequired: true,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
  });

  describe("Auto Renew Period", function () {
    async function verifyAccountCreationWithAutoRenewPeriod(accountId, autoRenewPeriodSeconds) {
      // If the account was created successfully, the queried account's auto renew periods should be equal.
      expect(autoRenewPeriodSeconds).to.equal(await consensusInfoClient.getAccountInfo(accountId).autoRenewPeriod);
      expect(autoRenewPeriodSeconds).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].auto_renew_period);
    }

    it("(#1) Creates an account with an auto renew period set to 60 days (5,184,000 seconds)", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with an auto-renew period set to 60 days.
      const autoRenewPeriodSeconds = 5184000;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        autoRenewPeriod: autoRenewPeriodSeconds,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithAutoRenewPeriod(response.accountId, autoRenewPeriodSeconds);
    });

    it("(#2) Creates an account with an auto renew period set to -1 seconds", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with an auto-renew period set to -1 seconds. The network should respond with an INVALID_RENEWAL_PERIOD status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          autoRenewPeriod: -1,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });

    it("(#3) Creates an account with an auto renew period set to the minimum period of 30 days (2,592,000 seconds)", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with an auto-renew period set to 30 days.
      const autoRenewPeriodSeconds = 2592000;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        autoRenewPeriod: autoRenewPeriodSeconds,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithAutoRenewPeriod(response.accountId, autoRenewPeriodSeconds);
    });

    it("(#4) Creates an account with an auto renew period set to the minimum period of 30 days minus one second (2,591,999 seconds)", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with an auto-renew period set to 2,591,999 seconds. The network should respond with an AUTORENEW_DURATION_NOT_IN_RANGE status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          autoRenewPeriod: 2591999,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "AUTORENEW_DURATION_NOT_IN_RANGE");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });

    it("(#5) Creates an account with an auto renew period set to the maximum period of 8,000,001 seconds", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with an auto-renew period set to 90ish days.
      const autoRenewPeriodSeconds = 8000001;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        autoRenewPeriod: autoRenewPeriodSeconds,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithAutoRenewPeriod(response.accountId, autoRenewPeriodSeconds);
    });

    it("(#6) Creates an account with an auto renew period set to the maximum period plus one seconds (8,000,002 seconds)", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with an auto-renew period set to 8,000,002 seconds. The network should respond with an AUTORENEW_DURATION_NOT_IN_RANGE status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          autoRenewPeriod: 8000002,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "AUTORENEW_DURATION_NOT_IN_RANGE");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
  });

  describe("Memo", async function () {
    async function verifyAccountCreationWithMemo(accountId, memo) {
      // If the account was created successfully, the queried account's memos should be equal.
      expect(memo).to.equal(await consensusInfoClient.getAccountInfo(accountId).memo);
      expect(memo).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].memo);
    }

    it("(#1) Creates an account with a valid memo", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with a memo set to "testmemo".
      const memo = "testmemo";
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        memo: memo,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithMemo(response.accountId, memo);
    });

    it("(#2) Creates an account with an empty memo", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with an empty memo.
      const memo = "";
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        memo: memo,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithMemo(response.accountId, memo);
    });

    it("(#3) Creates an account with a memo that is 100 characters", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with a memo set to the maximum length.
      const memo = "This is a really long memo but it is still valid because it is 100 characters exactly on the money!!";
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        memo: memo,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithMemo(response.accountId, memo);
    });

    it("(#4) Creates an account with a memo that exceeds 100 characters", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with a memo over the maximum length. The network should respond with an MEMO_TOO_LONG status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          memo: "This is a long memo that is not valid because it exceeds 100 characters and it should fail the test!!",
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "MEMO_TOO_LONG");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
  });

  describe("Max Automatic Token Associations", async function () {
    async function verifyAccountCreationWithMaxAutoTokenAssociations(accountId, maxAutomaticTokenAssociations) {
      // If the account was created successfully, the queried account's max automatic token associations should be equal.
      expect(maxAutomaticTokenAssociations).to.equal(await consensusInfoClient.getAccountInfo(accountId).maxAutomaticTokenAssociations);
      expect(maxAutomaticTokenAssociations).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].max_automatic_token_associations);
    }

    it("(#1) Creates an account with a max token association set to 0", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      // Attempt to create an account with the max automatic token associations set to 0.
      const maxAutomaticTokenAssociations = 0;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        maxAutomaticTokenAssociations: maxAutomaticTokenAssociations,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithMaxAutoTokenAssociations(response.accountId, maxAutomaticTokenAssociations)
    });

    it("(#2) Creates an account with a max token association set to 100", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      // Attempt to create an account with the max automatic token associations set to 100.
      const maxAutomaticTokenAssociations = 100;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        maxAutomaticTokenAssociations: maxAutomaticTokenAssociations,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithMaxAutoTokenAssociations(response.accountId, maxAutomaticTokenAssociations)
    });

    it("(#3) Creates an account with a max token association that is the maximum value", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      // Attempt to create an account with the max automatic token associations set to the maximum value.
      const maxAutomaticTokenAssociations = 1000;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        maxAutomaticTokenAssociations: maxAutomaticTokenAssociations,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithMaxAutoTokenAssociations(response.accountId, maxAutomaticTokenAssociations)
    });

    it("(#4) Creates an account with a max token association that is the maximum value plus one", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with the max automatic token associations over the maximum value. The network should respond with an REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          maxAutomaticTokenAssociations: 1001,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT");
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
  });

  describe("Staked ID", async function () {
    async function verifyAccountCreationWithStakedAccountId(accountId, stakedAccountId) {
      // If the account was created successfully, the queried account's staked account IDs should be equal.
      expect(stakedAccountId).to.equal(await consensusInfoClient.getAccountInfo(accountId).stakedAccountId);
      expect(stakedAccountId).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].staked_account_id);
    }
    
    async function verifyAccountCreationWithStakedAccountId(accountId, stakedNodeId) {
      // If the account was created successfully, the queried account's staked node IDs should be equal.
      expect(stakedNodeId).to.equal(await consensusInfoClient.getAccountInfo(accountId).stakedNodeId);
      expect(stakedNodeId).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].staked_node_id);
    }

    it("(#1) Creates an account with the staked account ID set to the operators account ID", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      // Attempt to create an account with the staked account ID set to the operator's account ID.
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        stakedAccountId: process.env.OPERATOR_ACCOUNT_ID,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithStakedAccountId(response.accountId, process.env.OPERATOR_ACCOUNT_ID);
    });

    it("(#2) Creates an account with the staked node ID set to a valid node ID", async function () {
      // Only run this test in a local setup.
      if (await getNodeType(process.env.NODE_TYPE)) this.skip();

      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      // Attempt to create an account with the staked node ID set to the operator's account ID.
      // TODO: figure out from where to grab the correct node ID. .env file?? For now, using random node ID.
      const stakedNodeId = Math.floor(Math.random() * 6) + 1;
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        stakedNodeId: stakedNodeId,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithStakedAccountId(response.accountId, stakedNodeId);
    });

    it("(#3) Creates an account with the staked account ID set to an account ID that doesn't exist", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      try {
        // Attempt to create an account with a staked account ID that doesn't exist. The network should respond with an INVALID_STAKING_ID status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          stakedAccountId: "123.456.789",
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_STAKING_ID");
        return;
      }
      assert.fail("Should throw an error");
    });

    it("(#4) Creates an account with the staked node ID set to a node ID that doesn't exist", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      try {
        // Attempt to create an account with a staked node ID that doesn't exist. The network should respond with an INVALID_STAKING_ID status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          stakedNodeId: 123456789,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_STAKING_ID");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
    
    it("(#5) Creates an account with the staked account ID set to an empty account ID", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      try {
        // Attempt to create an account with a staked node ID that doesn't exist. The SDK should throw an internal error.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          stakedAccountId: "",
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
    
    it("(#6) Creates an account with the staked node ID set to an invalid node ID", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();
      
      try {
        // Attempt to create an account with an invalid staked node ID. The network should respond with an INVALID_STAKING_ID status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          stakedNodeId: -100,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_STAKING_ID");
        return;
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });

    it("(#7) Creates an account with a staked account ID and a staked node ID", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with a staked account ID and a staked node ID. The network should respond with an INVALID_STAKING_ID status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          stakedAccountId: process.env.OPERATOR_ACCOUNT_ID,
          stakedNodeId: Math.floor(Math.random() * 6) + 1,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_STAKING_ID");
        return;
      }
    });
  });

  describe("Decline Rewards", async function () {
    async function verifyAccountCreationWithDeclineRewards(accountId, declineRewards) {
      // If the account was created successfully, the queried account's decline rewards policy should be equal.
      expect(declineRewards).to.equal(await consensusInfoClient.getAccountInfo(accountId).stakingInfo.declineStakingReward);
      expect(declineRewards).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].decline_reward);
    }

    it("(#1) Creates an account that declines staking rewards", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with that declines staking rewards.
      const declineStakingReward = true
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        declineStakingReward: declineStakingReward,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithDeclineRewards(response.accountId, declineStakingReward);
    });

    it("(#2) Creates an account that doesn't decline staking rewards", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Attempt to create an account with that doesn't decline staking rewards.
      const declineStakingReward = false
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        declineStakingReward: declineStakingReward,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithDeclineRewards(response.accountId, declineStakingReward);
    });
  });

  describe("Alias", async function () {
    async function verifyAccountCreationWithAlias(accountId, alias) {
      // If the account was created successfully, the queried account's aliases should be equal.
      expect(alias).to.equal(await consensusInfoClient.getAccountInfo(accountId).aliasKey);
      expect(alias).to.equal(await mirrorNodeClient.getAccountData(accountId).accounts[0].alias);
    }

    it("(#1) Creates an account with the keccak-256 hash of an ECDSAsecp256k1 public key", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Generate the ECDSAsecp256k1 private key of the alias for the account.
      const ecdsaSecp256k1PrivateKey = await JSONRPCRequest("generateKey", {
        "type": "ecdsaSecp256k1PrivateKey"
      });

      // Generate the ECDSAsecp256k1 public key associated with the private key, which will then be used as the alias for the account.
      const ecdsaSecp256k1PublicKey = await JSONRPCRequest("generateKey", {
        "type": "ecdsaSecp256k1PublicKey",
        "privateKey": ecdsaSecp256k1PrivateKey.key
      });

      // Attempt to create an account with the alias.
      const alias = EvmAddress.fromString(ecdsaSecp256k1PublicKey.key).toString();
      const response = await JSONRPCRequest("createAccount", {
        key: key.key,
        alias: alias,
        signerKey: ecdsaSecp256k1PrivateKey.key
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyAccountCreationWithAlias(response.accountId, alias);
    });

    it("(#2) Creates an account with the keccak-256 hash of an ECDSAsecp256k1 public key without a signature", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      // Generate the ECDSAsecp256k1 public key to be used as the alias for the account.
      const ecdsaSecp256k1PublicKey = await JSONRPCRequest("generateKey", {
        "type": "ecdsaSecp256k1PublicKey"
      });
      
      try {
        // Attempt to create an account with the alias without signing with the associated ECDSAsecp256k1 private key. The network should respond with an INVALID_SIGNATURE status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          alias: EvmAddress.fromString(ecdsaSecp256k1PublicKey.key).toString(),
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });

    it("(#3) Creates an account with an invalid alias", async function () {
      // Generate a valid key for the account.
      const key = await JSONRPCRequest("generateKey", {});
      if (key.status === "NOT_IMPLEMENTED") this.skip();

      try {
        // Attempt to create an account with an invalid alias. The network should respond with an INVALID_ALIAS_KEY status.
        const response = await JSONRPCRequest("createAccount", {
          key: key.key,
          alias: crypto.randomBytes(20).toString(),
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_ALIAS_KEY");
      }
      
      // This shouldn't happen, the JSONRPCRequest should throw.
      assert.fail("Should throw an error");
    });
  });

  return Promise.resolve();
});
