import { JSONRPCRequest } from "../../client.js";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { generateAccountKeys, setOperator, getNodeType } from "../../setup_Tests.js";
import { PrivateKey } from "@hashgraph/sdk";
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
      // If the account was created successfully, the queried account IDs should be equal.
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
        // Generate a random key value (88 is equal to the byte length of a valid public key).
        const invalidPublicKey = crypto.randomBytes(88).toString();
        
        // Attempt to create an account with the invalid key. The SDK should throw an internal error.
        const response = await JSONRPCRequest("createAccount", {
          publicKey: invalidPublicKey
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
      // If the account was created successfully, the queried account balances should be equal.
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
      // If the account was created successfully, the queried account receiver signature required policies should be equal.
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
      // If the account was created successfully, the queried account auto renew periods should be equal.
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
      // If the account was created successfully, the queried account memos should be equal.
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

  //----------- Maximum number of tokens that an Account be associated with -----------
  describe.only("Max Token Association", function () {
    // Creates an account with a default max token association
    // maxAutomaticTokenAssociations can be queried via consensus node with AccountInfoQuery
    it("Default max token association", async function () {
      const response = await JSONRPCRequest("createAccount", {
        publicKey: publicKey,
        initialBalance: 0,
        maxAutomaticTokenAssociations: 0,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const newAccountId = response.accountId;
      // consensus node account
      const accountInfoFromConsensusNode = await consensusInfoClient.getAccountInfo(newAccountId);
      const acctMaxTokenConsensus = accountInfoFromConsensusNode.maxAutomaticTokenAssociations.low;

      assert.equal(acctMaxTokenConsensus, 0);
    });
    // Creates an account with max token set to the maximum
    it("Max token set to the maximum", async function () {
      const response = await JSONRPCRequest("createAccount", {
        publicKey: publicKey,
        initialBalance: 0,
        maxAutomaticTokenAssociations: 5000,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const newAccountId = response.accountId;
      // consensus node account
      const accountInfoFromConsensusNode = await consensusInfoClient.getAccountInfo(newAccountId);
      const acctMaxTokenConsensus = accountInfoFromConsensusNode.maxAutomaticTokenAssociations.low;

      assert.equal(acctMaxTokenConsensus, 5000);
    });
    // Create an account with token association over the max
    it("Max token association over the maximum - should have status REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT", async function () {
      try {
        const response = await JSONRPCRequest("createAccount", {
          publicKey: publicKey,
          initialBalance: 0,
          maxAutomaticTokenAssociations: 5001,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
        assert.fail("Expected an error but none was thrown.");
      } catch (err) {
        assert.equal(err.data.status, "REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT");
      }
    });
  });

  //----------- Staked ID - ID of the account to which is staking --------------------
  describe("Staked ID, ID of account or node to which is staking", async function () {
    // Create an account and set staked account ID to operator account ID
    it("Creates an account and sets staked account ID to operator account ID", async function () {
      // Create account with the JSON-RPC that includes a staked account Id
      const response = await JSONRPCRequest("createAccount", {
        publicKey: publicKey,
        stakedAccountId: process.env.OPERATOR_ACCOUNT_ID,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const newAccountId = response.accountId;

      // query account via consensus node to verify creation
      const accountInfoFromConsensusNode = await consensusInfoClient.getAccountInfo(newAccountId);
      const accountID = accountInfoFromConsensusNode.accountId.toString();
      const stakedIDFromConsensusNode = accountInfoFromConsensusNode.stakingInfo.stakedAccountId.toString();

      // query account via mirror node to confirm availability after creation
      const respJSON = await mirrorNodeClient.getAccountData(accountID);
      const stakedIDFromMirrorNode = respJSON.accounts[0].staked_account_id;

      // confirm pass for account creation with a set staked account ID
      expect(stakedIDFromConsensusNode).to.equal(process.env.OPERATOR_ACCOUNT_ID);
      expect(stakedIDFromMirrorNode).to.equal(process.env.OPERATOR_ACCOUNT_ID);
    });
    // Create an account and set staked node ID and a node ID
    it("Creates an account and sets staked node ID to a node ID", async function () {
      if (await getNodeType(process.env.NODE_TYPE)) this.skip();

      // select a staked node id between 0 and 6 for the test
      const randomNodeId = Math.floor(Math.random() * 6) + 1;
      const response = await JSONRPCRequest("createAccount", {
        publicKey: publicKey,
        stakedNodeId: randomNodeId,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const newAccountId = response.accountId;

      // query account via consensus node to verify creation
      const accountInfoFromConsensusNode = await consensusInfoClient.getAccountInfo(newAccountId);
      const accountID = accountInfoFromConsensusNode.accountId.toString();
      const stakedNodeIDFromConsensusNode = accountInfoFromConsensusNode.stakingInfo.stakedNodeId.low.toString();

      // query account via mirror node to confirm availability after creation
      const respJSON = await mirrorNodeClient.getAccountData(accountID);
      const stakedNodeIDFromMirrorNode = respJSON.accounts[0].staked_node_id;

      // confirm pass for account creation with a set staked node ID
      expect(Number(stakedNodeIDFromConsensusNode)).to.equal(randomNodeId);
      expect(Number(stakedNodeIDFromMirrorNode)).to.equal(randomNodeId);
    });
    // Create an account and set the staked account ID to an invalid ID
    it("Creates an account and sets the staked account ID to an invalid ID", async function () {
      /**
       * The staking account id or staking node id given is invalid or does not exist.
       * INVALID_STAKING_ID = 322;
       **/
      try {
        const invalidStakedId = "9.9.999999";
        const response = await JSONRPCRequest("createAccount", {
          publicKey: publicKey,
          stakedAccountId: invalidStakedId,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_STAKING_ID");
        return;
      }
      assert.fail("Should throw an error");
    });
    // Create an account and set the staked node ID to an invalid node
    it("Creates an account and sets the staked node ID to an invalid node", async function () {
      /**
       * The staking account id or staking node id given is invalid or does not exist.
       * INVALID_STAKING_ID = 322;
       **/
      try {
        // select a staked node id greater than 6 for the test
        const invalidNodeId = 10;
        const response = await JSONRPCRequest("createAccount", {
          publicKey: publicKey,
          stakedNodeId: invalidNodeId,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_STAKING_ID");
        return;
      }
      assert.fail("Should throw an error");
    });
    // Create an account and set staked account ID with no input
    it("Creates an account and sets staked account ID with no input", async function () {
      try {
        // set a staked node Id with no input
        const noInputStakedAccountId = "";
        const response = await JSONRPCRequest("createAccount", {
          publicKey: publicKey,
          stakedAccountId: noInputStakedAccountId,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
        // confirm error thrown for create with no input for staked account ID
      } catch (err) {
        return;
      }
      assert.fail("Should throw an error");
    });
    // Create an account and set staked account ID with no input
    it("Creates an account and sets staked node ID with no input", async function () {
      try {
        // set a staked node Id with no input
        const noInputStakedNodeId = "";
        const response = await JSONRPCRequest("createAccount", {
          publicKey: publicKey,
          stakedNodeId: noInputStakedNodeId,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
        // confirm error thrown for create with no input for staked account ID
      } catch (err) {
        return;
      }
      assert.fail("Should throw an error");
    });
    // Create an account and set both a staking account ID and node ID
    it("Creates an account and sets both a staking account ID and node ID", async function () {
      try {
        // set staked account ID to operator account ID
        const stakedAccountId = process.env.OPERATOR_ACCOUNT_ID;
        // select a staked node id betwen 0 and 6 for the test
        const stakedNodeId = Math.floor(Math.random() * 6) + 1;

        // request JSON-RPC create account with both StakedAccountId and StakedNodeId
        const response = await JSONRPCRequest("createAccount", {
          publicKey: publicKey,
          stakedAccountId: stakedAccountId,
          stakedNodeId: stakedNodeId,
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_STAKING_ID");
        return;
      }
    });
  });

  //----------- If true - account declines receiving a staking reward -----------
  describe("Account declines receiving a staking reward", async function () {
    // Create an account and set the account to decline staking rewards
    it("Creates an account and set the account to decline staking rewards", async function () {
      // Create acount with the JSON-RPC that declines rewards for staking
      const response = await JSONRPCRequest("createAccount", {
        publicKey: publicKey,
        declineStakingReward: true,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const newAccountID = response.accountId;
      // Query the consensus node
      const cNodeQuery = await consensusInfoClient.getAccountInfo(newAccountID);
      const cNodeRes = cNodeQuery.stakingInfo.declineStakingReward;

      // Query the mirror node
      const mNodeQuery = await mirrorNodeClient.getAccountData(newAccountID);
      const mNodeRes = mNodeQuery.accounts[0].decline_reward;

      expect(cNodeRes).to.be.true;
      expect(mNodeRes).to.be.true;
    });
    // Create an account and leave decline rewards at default value
    it("Creates an account and leave staking rewards at default value", async function () {
      const response = await JSONRPCRequest("createAccount", {
        publicKey: publicKey,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const newAccountID = response.accountId;
      // first query consensus node
      const cNodeQuery = await consensusInfoClient.getAccountInfo(newAccountID);
      const cNodeRes = cNodeQuery.stakingInfo.declineStakingReward;

      // Query the mirror node
      const mNodeQuery = await mirrorNodeClient.getAccountData(newAccountID);
      const mNodeRes = mNodeQuery.accounts[0].decline_reward;

      expect(cNodeRes).to.be.false;
      expect(mNodeRes).to.be.false;
    });
  });

  ///----------- Set account alias -----------
  describe("Create account with alias", async function () {
    // Create an account by using an alias
    it("should create an account using an 'alias'", async function () {
      // set initial balance to 100 Hbar
      const initialBalance = 100;

      // create public/private key pair then generate alias consisting of <shard>.<realm>.<bytes>
      const aliasPublicKey = PrivateKey.generateED25519().publicKey;
      const aliasID = aliasPublicKey.toAccountId(0, 0);
      const aliasIdStr = JSON.stringify(aliasID.toString());

      // initiate request for JSON-RPC server to transfer into alias account to initiate account creation
      // Create alias account with the JSON-RPC
      const response = await JSONRPCRequest("createAccountFromAlias", {
        operator_id: process.env.OPERATOR_ACCOUNT_ID,
        aliasAccountId: aliasIdStr,
        initialBalance: initialBalance,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // query account via consensus node to verify creation
      const accountInfoFromConsensusNode = await consensusInfoClient.getAccountInfo(aliasID);
      const accountIDFromConsensusNode = accountInfoFromConsensusNode.accountId.toString();

      // query account via mirror node to confirm availability after creation
      const accountInfoFromMirrorNode = await mirrorNodeClient.getAccountData(accountIDFromConsensusNode);
      const accountAliasFromMirrorNode = accountInfoFromMirrorNode.accounts[0].alias;
      const accountMemoFromMirrorNode = accountInfoFromMirrorNode.accounts[0].memo;

      expect(accountInfoFromConsensusNode.aliasKey.toString()).to.equal(aliasPublicKey.toString());
      expect(accountInfoFromConsensusNode.accountMemo).to.equal("auto-created account");
      expect(accountAliasFromMirrorNode).to.not.be.null;
      expect(accountMemoFromMirrorNode).to.equal("auto-created account");
    });
  });

  return Promise.resolve();
});
