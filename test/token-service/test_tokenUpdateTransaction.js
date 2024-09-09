import { JSONRPCRequest } from "../../client.js";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { setOperator } from "../../setup_Tests.js";
import crypto from "crypto";
import { assert, expect } from "chai";

// Needed to convert BigInts to JSON number format.
BigInt.prototype.toJSON = function () {
  return JSON.rawJSON(this.toString())
}

/**
 * Tests for TokenUpdateTransaction
 */
describe("TokenCreateTransaction", function () {  
  // Tests should not take longer than 30 seconds to fully execute.
  this.timeout(30000);

  // Initial token parameters.
  const initialTokenName = "testname";
  const initialTokenSymbol = "testsymbol";
  const initialTreasuryAccountId = process.env.OPERATOR_ACCOUNT_ID;
  const initialSupply = 1000000;

  // Two tokens should be created. One immutable token (no admin key) and another mutable.
  let immutableTokenId, mutableTokenId, mutableTokenAdminKey;

  // Some tests require an immutable token. Since it's immutable only one needs to be created.
  before(async function () {
    setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);
  
    let response = JSONRPCRequest("createToken", {
      name: initialTokenName,
      symbol: initialTokenSymbol,
      treasuryAccountId: initialTreasuryAccountId,
      initialSupply: initialSupply,
      tokenType: "ft"
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    immutableTokenId = response.tokenId;
  });

  beforeEach(async function () {
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);

    let response = await JSONRPCRequest("generateKey", {
      type: "ecdsaSecp256k1PrivateKey"
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    mutableTokenAdminKey = response.key;

    response = await JSONRPCRequest("createToken", {
      name: initialTokenName,
      symbol: initialTokenSymbol,
      treasuryAccountId: initialTreasuryAccountId,
      adminKey: mutableTokenAdminKey,
      initialSupply: initialSupply,
      tokenType: "ft"
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    mutableTokenId = response.tokenId;
  });
  afterEach(async function () {
    await JSONRPCRequest("reset");
  });

  describe("Token ID", function () {
    async function verifyTokenUpdate(tokenId) {
        let mirrorNodeData = await mirrorNodeClient.getTokenData(accountId);
        let consensusNodeData = await consensusInfoClient.getTokenInfo(accountId);
        expect(accountId).to.be.equal(mirrorNodeData.tokens[0].token);
        expect(accountId).to.be.equal(consensusNodeData.tokens.toString());
    }

    it("(#1) Updates an immutable token with no updates", async function () {
      const response = await JSONRPCRequest("updateToken", {
        tokenId: immutableTokenId
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenUpdate(response.tokenId);
    });

    it("(#2) Updates a mutable token with no updates", async function () {
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenUpdate(response.tokenId);
    });

    it("(#3) Updates a token with no token ID", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Symbol", function () {
    async function verifyTokenSymbolUpdate(tokenId, symbol) {
      expect(symbol).to.equal(await consensusInfoClient.getTokenInfo(tokenId).symbol);
      expect(symbol).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].symbol);
    }

    it("(#1) Updates an immutable token with a symbol", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          tokenId: immutableTokenId,
          symbol: "t"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a symbol that is the minimum length", async function () {
      const symbol = "t";
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        symbol: symbol,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenSymbolUpdate(response.tokenId, symbol);
    });

    it("(#3) Updates a mutable token with a symbol that is empty", async function () {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          symbol: "",
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
  
        // Symbol shouldn't change and should still remain as its initial value.
        verifyTokenSymbolUpdate(response.tokenId, initialTokenSymbol);
    });

    it("(#4) Updates a mutable token with a symbol that is the maximum length", async function () {
      const symbol = "This is a really long symbol but it is still valid because it is 100 characters exactly on the money"
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        symbol: symbol,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenSymbolUpdate(response.tokenId, symbol);
    });

    it("(#5) Updates a mutable token with a symbol that exceeds the maximum length", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          symbol: "This is a long symbol that is not valid because it exceeds 100 characters and it should fail the test",
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_SYMBOL_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Updates a mutable token with a valid symbol without signing with the token's admin key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          symbol: "t"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Name", function () {
    async function verifyTokenNameUpdate(tokenId, name) {
      expect(name).to.equal(await consensusInfoClient.getTokenInfo(tokenId).name);
      expect(name).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].name);
    }

    it("(#1) Updates an immutable token with a name", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          tokenId: immutableTokenId,
          name: "t"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a name that is the minimum length", async function () {
      const name = "t";
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        name: name,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenNameUpdate(response.tokenId, name);
    });

    it("(#3) Updates a mutable token with a name that is empty", async function () {
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        name: "",
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
  
      // Name shouldn't change and should still remain as its initial value.
      verifyTokenNameUpdate(response.tokenId, initialTokenName);
    });

    it("(#4) Updates a mutable token with a name that is the maximum length", async function () {
      const name = "This is a really long name but it is still valid because it is 100 characters exactly on the money!!"
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        name: name,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenNameUpdate(response.tokenId, name);
    });

    it("(#5) Updates a mutable token with a name that exceeds the maximum length", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          name: "This is a long name that is not valid because it exceeds 100 characters and it should fail the test!!",
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_NAME_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Updates a mutable token with a valid name without signing with the token's admin key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          name: "t"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Treasury Account ID", function () {
    it("(#1) Updates an immutable token with a treasury account", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a treasury account", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        treasuryAccountId: accountId,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            key
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      expect(accountId).to.equal(await consensusInfoClient.getTokenInfo(tokenId).treasuryAccountId.toString());
      expect(accountId).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].treasury_account_id);

      // Make sure the tokens were transferred from the initial treasury account to the new treasury account.
      const initialTreasuryAccountBalance = await consensusInfoClient.getBalance(process.env.OPERATOR_ACCOUNT_ID);
      const newTreasuryAccountBalance = await consensusInfoClient.getBalance(accountId);

      assert(initialTreasuryAccountBalance.tokens.has(mutableTokenId)).is.true;
      assert(newTreasuryAccountBalance.tokens.has(mutableTokenId)).is.true;

      expect(initialTreasuryAccountBalance.tokens.get(mutableTokenId).size).to.equal(0);
      expect(newTreasuryAccountBalance.tokens.get(mutableTokenId).size).to.equal(initialSupply);
    });

    it("(#3) Updates a mutable token with a treasury account without signing with the account's private key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;
  
      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenAdminKey,
          treasuryAccountId: accountId,
          commonTransactionParams: {
            signers: [
                mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#4) Updates a mutable token with a treasury account that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          treasuryAccountId: "123.456.789",
          commonTransactionParams: {
            signers: [
                mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_ACCOUNT_ID");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#5) Updates a mutable token with a treasury account that is deleted", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;
  
      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;
  
      response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: accountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
            signers: [
                key
            ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenAdminKey,
          treasuryAccountId: accountId,
          commonTransactionParams: {
            signers: [
                mutableTokenAdminKey,
                key
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "ACCOUNT_DELETED");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#6) Updates a mutable token with a treasury account without signing with the token's admin key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;
  
      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenAdminKey,
          treasuryAccountId: accountId,
          commonTransactionParams: {
            signers: [
              key
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }
  
      assert.fail("Should throw an error");
    });
  });

  describe("Admin Key", function () {
    async function verifyTokenAdminKeyUpdate(tokenId, adminKey) {
      expect(adminKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).adminKey.toStringDer());
      expect(adminKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].admin_key);
    }

    it("(#1) Updates an immutable token with a valid key as its admin key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          adminKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its admin key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        adminKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenAdminKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its admin key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        adminKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenAdminKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its admin key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        adminKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenAdminKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its admin key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        adminKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenAdminKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its admin key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        adminKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenAdminKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its admin key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        adminKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenAdminKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its admin key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        adminKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenAdminKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its admin key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          adminKey: key,
          commonTransactionParams: {
            signers: [
                mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its admin key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          adminKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
                mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("KYC Key", function () {
    async function verifyTokenKycKeyUpdate(tokenId, kycKey) {
      expect(kycKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).kycKey.toStringDer());
      expect(kycKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].kyc_key);
    }

    it("(#1) Updates an immutable token with a valid key as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          kycKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        kycKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenKycKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        kycKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenKycKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        kycKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenKycKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        kycKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenKycKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        kycKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenKycKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its KYC key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        kycKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenKycKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        kycKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenKycKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its KYC key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          kycKey: key,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its KYC key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          kycKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Freeze Key", function () {
    async function verifyTokenFreezeKeyUpdate(tokenId, freezeKey) {
      expect(freezeKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).freezeKey.toStringDer());
      expect(freezeKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].freeze_key);
    }

    it("(#1) Updates an immutable token with a valid key as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          freezeKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        freezeKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenFreezeKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        freezeKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenFreezeKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        freezeKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenFreezeKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        freezeKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenFreezeKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        freezeKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenFreezeKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its freeze key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        freezeKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenFreezeKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        freezeKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenFreezeKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its freeze key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          freezeKey: key,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its freeze key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          freezeKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Wipe Key", function () {
    async function verifyTokenWipeKeyUpdate(tokenId, wipeKey) {
      expect(wipeKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).wipeKey.toStringDer());
      expect(wipeKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].wipe_key);
    }

    it("(#1) Updates an immutable token with a valid key as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          wipeKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        wipeKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenWipeKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        wipeKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenWipeKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        wipeKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenWipeKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        wipeKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenWipeKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        wipeKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenWipeKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its wipe key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        wipeKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenWipeKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        wipeKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenWipeKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its wipe key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          wipeKey: key,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its wipe key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          wipeKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Supply Key", function () {
    async function verifyTokenSupplyKeyUpdate(tokenId, supplyKey) {
      expect(supplyKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).supplyKey.toStringDer());
      expect(supplyKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].supply_key);
    }

    it("(#1) Updates an immutable token with a valid key as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          supplyKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        supplyKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenSupplyKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        supplyKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenSupplyKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        supplyKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenSupplyKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        supplyKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenSupplyKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its supply key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        supplyKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenSupplyKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its supply key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        supplyKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenSupplyKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its supply key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        supplyKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenSupplyKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its supply key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          supplyKey: key,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its supply key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          supplyKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Auto Renew Account", function () {
    it("(#1) Updates an immutable token with an auto renew account", async function () {  
        try {
          const response = await JSONRPCRequest("updateToken", {
            tokenId: immutableTokenId,
            autoRenewAccountId: process.env.OPERATOR_ACCOUNT_ID
          });
          if (response.status === "NOT_IMPLEMENTED") this.skip();
        } catch (err) {
          assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
          return;
        }
    
        assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with an auto renew account", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        autoRenewAccountId: accountId,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            key
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      const tokenId = response.tokenId;
      expect(accountId).to.equal(await consensusInfoClient.getTokenInfo(tokenId).autoRenewAccountId.toString());
      expect(accountId).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].auto_renew_account);
    });

    it("(#3) Updates a mutable token with an auto renew account without signing with the account's private key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewAccountId: accountId,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#4) Updates a mutable token with an auto renew account that doesn't exist", async function () {
      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewAccountId: "123.456.789",
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_AUTORENEW_ACCOUNT");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#5) Updates a mutable token with an empty auto renew account", async function () {
      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewAccountId: "",
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Updates a mutable token with an auto renew account that is deleted", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: accountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
          signers: [
            key
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewAccountId: accountId,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey,
              key
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_AUTORENEW_ACCOUNT");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#7) Updates a mutable token with an auto renew account without signing with the token's admin key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;
  
      response = await JSONRPCRequest("createAccount", {
        key: key
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenAdminKey,
          autoRenewAccountId: accountId,
          commonTransactionParams: {
            signers: [
              key
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }
  
      assert.fail("Should throw an error");
    });
  });

  describe("Auto Renew Period", function () {
    async function verifyTokenAutoRenewPeriodUpdate(tokenId, autoRenewPeriod) {
      expect(autoRenewPeriod).to.equal(await consensusInfoClient.getTokenInfo(tokenId).autoRenewPeriod);
      expect(autoRenewPeriod).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].auto_renew_period);
    }
    
    it("(#1) Updates an immutable token with an auto renew period set to 60 days (5,184,000 seconds)", async function () {  
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          autoRenewPeriod: 5184000
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with an auto renew period set to 0 seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 0,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#3) Updates a mutable token with an auto renew period set to -1 seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: -1,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#4) Updates a mutable token with an auto renew period set to 9,223,372,036,854,775,807 (int64 max) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 9223372036854775807n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#5) Updates a mutable token with an auto renew period set to 9,223,372,036,854,775,806 (int64 max - 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 9223372036854775806n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#6) Updates a mutable token with an auto renew period set to 9,223,372,036,854,775,808 (int64 max + 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 9223372036854775808n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#7) Updates a mutable token with an auto renew period set to 18,446,744,073,709,551,615 (uint64 max) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 18446744073709551615n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#8) Updates a mutable token with an auto renew period set to 18,446,744,073,709,551,614 (uint64 max - 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 18446744073709551614n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#9) Updates a mutable token with an auto renew period set to -9,223,372,036,854,775,808 (int64 min) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: -9223372036854775808n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an auto renew period set to -9,223,372,036,854,775,807 (int64 min + 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: -9223372036854775807n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#11) Updates a mutable token with an auto renew period set to 60 days (5,184,000 seconds)", async function () {
      const autoRenewPeriod = 5184000;
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        autoRenewPeriod: autoRenewPeriod,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });

      verifyTokenAutoRenewPeriodUpdate(response.tokenId, autoRenewPeriod);
    });

    it("(#12) Updates a mutable token with an auto renew period set to 30 days (2,592,000 seconds)", async function () {
      const autoRenewPeriod = 2592000;
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        autoRenewPeriod: autoRenewPeriod,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });

      verifyTokenAutoRenewPeriodUpdate(response.tokenId, autoRenewPeriod);
    });

    it("(#13) Updates a mutable token with an auto renew period set to 30 days minus one second (2,591,999 seconds)", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 2591999,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "AUTORENEW_DURATION_NOT_IN_RANGE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#14) Updates a mutable token with an auto renew period set to 8,000,001 seconds", async function () {
      const autoRenewPeriod = 8000001;
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        autoRenewPeriod: autoRenewPeriod,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });

      verifyTokenAutoRenewPeriodUpdate(response.tokenId, autoRenewPeriod);
    });

    it("(#15) Updates a mutable token with an auto renew period set to 8,000,002 seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          autoRenewPeriod: 8000002,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "AUTORENEW_DURATION_NOT_IN_RANGE");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Expiration Time", function () {
    async function verifyTokenExpirationTimeUpdate(tokenId, expirationTime) {
      expect(expirationTime).to.equal(await consensusInfoClient.getTokenInfo(tokenId).expirationTime);
      expect(expirationTime).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].expiry_timestamp);
    }
    
    it("(#1) Updates an immutable token with a valid expiration time", async function () {  
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          expirationTime: parseInt((Date.now() / 1000) + 5184000)
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token to an expiration time of 0", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: 0,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#3) Updates a mutable token to an expiration time of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: -1,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#4) Updates a mutable token to an expiration time of 9,223,372,036,854,775,807 (int64 max) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: 9223372036854775807n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#5) Updates a mutable token to an expiration time of 9,223,372,036,854,775,806 (int64 max - 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: 9223372036854775806n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Updates a mutable token to an expiration time of 9,223,372,036,854,775,808 (int64 max + 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: 9223372036854775808n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#7) Updates a mutable token to an expiration time of 18,446,744,073,709,551,615 (uint64 max) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: 18446744073709551615n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#8) Updates a mutable token to an expiration time of 18,446,744,073,709,551,614 (uint64 max - 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: 18446744073709551614n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#9) Updates a mutable token to an expiration time of -9,223,372,036,854,775,808 (int64 min) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: -9223372036854775808n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token to an expiration time of -9,223,372,036,854,775,807 (int64 min + 1) seconds", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: -9223372036854775807n,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#11) Updates a mutable token to an expiration time of 60 days (5,184,000 seconds) from the current time", async function () {
      const expirationTime = parseInt((Date.now() / 1000) + 5184000);
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        expirationTime: expirationTime,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      
      verifyTokenExpirationTimeUpdate(response.tokenId, expirationTime);
    });

    it("(#12) Updates a mutable token to an expiration time of 30 days (2,592,000 seconds) from the current time", async function () {
      const expirationTime = parseInt((Date.now() / 1000) + 2592000);
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        expirationTime: expirationTime,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      
      verifyTokenExpirationTimeUpdate(response.tokenId, expirationTime);
    });

    it("(#13) Creates a token with an expiration time of 30 days minus one second (2,591,999 seconds) from the current time", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: parseInt((Date.now() / 1000) + 2591999),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }
    
      assert.fail("Should throw an error");
    });

    it("(#14) Updates a mutable token with an expiration time 8,000,001 seconds from the current time", async function () {
      const expirationTime = parseInt((Date.now() / 1000) + 8000001);
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        expirationTime: expirationTime,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      
      verifyTokenExpirationTimeUpdate(response.tokenId, expirationTime);
    });

    it("(#15) Updates a mutable token with an expiration time 8,000,002 seconds from the current time", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          expirationTime: 8000002,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Memo", function () {
    async function verifyTokenMemoUpdate(tokenId, memo) {
      expect(memo).to.equal(await consensusInfoClient.getTokenInfo(tokenId).memo);
      expect(memo).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].memo);
    }
    
    it("(#1) Updates an immutable token with a memo that is a valid length", async function () {  
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          memo: "testmemo"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a memo that is a valid length", async function () {
      const memo = "testmemo"
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        memo: memo,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMemoUpdate(response.tokenId, memo);
    });

    it("(#3) Updates a mutable token with a memo that is the minimum length", async function () {
      const memo = ""
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        memo: memo,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMemoUpdate(response.tokenId, memo);
    });

    it("(#4) Updates a mutable token with a memo that is the minimum length", async function () {
      const memo = "This is a really long memo but it is still valid because it is 100 characters exactly on the money!!"
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        memo: memo,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMemoUpdate(response.tokenId, memo);
    });

    it("(#5) Updates a mutable token with a memo that exceeds the maximum length", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          memo: "This is a long memo that is not valid because it exceeds 100 characters and it should fail the test!!",
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "MEMO_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Fee Schedule Key", function () {
    async function verifyTokenFeeScheduleKeyUpdate(tokenId, feeScheduleKey) {
      expect(feeScheduleKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).feeScheduleKey.toStringDer());
      expect(feeScheduleKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].fee_schedule_key);
    }

    it("(#1) Updates an immutable token with a valid key as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          feeScheduleKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenFeeScheduleKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenFeeScheduleKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenFeeScheduleKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenFeeScheduleKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its fee schedule key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenFeeScheduleKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its fee schedule key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenFeeScheduleKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its fee schedule key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenFeeScheduleKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its fee schedule key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          feeScheduleKey: key,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its fee schedule key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          feeScheduleKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Pause Key", function () {
    async function verifyTokenPauseKeyUpdate(tokenId, pauseKey) {
      expect(pauseKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).pauseKey.toStringDer());
      expect(pauseKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].pause_key);
    }

    it("(#1) Updates an immutable token with a valid key as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          feeScheduleKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenPauseKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenPauseKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenPauseKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenPauseKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its pause key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenPauseKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its pause key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenPauseKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its pause key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        feeScheduleKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenPauseKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its pause key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          feeScheduleKey: key,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its pause key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          feeScheduleKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Metadata", function () {
    async function verifyTokenMetadataUpdate(tokenId, metadata) {
      expect(metadata).to.equal(await consensusInfoClient.getTokenInfo(tokenId).metadata);
      expect(metadata).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].metadata);
    }
    
    it("(#1) Updates an immutable token with metadata", async function () {  
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          metadata: "1234"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with metadata", async function () {
      const metadata = "1234";
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadata: metadata,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMetadataUpdate(response.tokenId, metadata);
    });

    it("(#3) Updates a mutable token with empty metadata", async function () {
      const metadata = "";
      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadata: metadata,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMetadataUpdate(response.tokenId, metadata);
    });
  });

  describe("Metadata Key", function () {
    async function verifyTokenMetadataKeyUpdate(tokenId, metadataKey) {
      expect(metadataKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).metadataKey.toStringDer());
      expect(metadataKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].metadata_key);
    }

    it("(#1) Updates an immutable token with a valid key as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: immutableTokenId,
          metadataKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_IS_IMMUTABLE");
        return;
      }
  
      assert.fail("Should throw an error");
    });

    it("(#2) Updates a mutable token with a valid ED25519 public key as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadataKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenMetadataKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#3) Updates a mutable token with a valid ECDSAsecp256k1 public key as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadataKey: publicKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenMetadataKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#4) Updates a mutable token with a valid ED25519 private key as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadataKey: privateKey,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenMetadataKeyUpdate(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#5) Updates a mutable token with a valid ECDSAsecp256k1 private key as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const privateKey = response.key;

      response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey",
        fromKey: privateKey
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadataKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenMetadataKeyUpdate(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#6) Updates a mutable token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its metadata key", async function () {
      const keyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "ed25519PublicKey"
          },
          {
            type: "ecdsaSecp256k1PrivateKey"
          },
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          }
        ]
      });
      if (keyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadataKey: keyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMetadataKeyUpdate(response.tokenId, keyList.key);
    });

    it("(#7) Updates a mutable token with a valid KeyList of nested Keylists (three levels) as its metadata key", async function () {
      const nestedKeyList = await JSONRPCRequest("generateKey", {
        type: "keyList",
        keys: [
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ecdsaSecp256k1PrivateKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ecdsaSecp256k1PublicKey"
              },
              {
                type: "ed25519PublicKey"
              }
            ]
          },
          {
            type: "keyList",
            keys: [
              {
                type: "ed25519PrivateKey"
              },
              {
                type: "ecdsaSecp256k1PublicKey"
              }
            ]
          }
        ]
      });
      if (nestedKeyList.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadataKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
            mutableTokenAdminKey,
            nestedKeyList.privateKeys[0],
            nestedKeyList.privateKeys[1],
            nestedKeyList.privateKeys[2],
            nestedKeyList.privateKeys[3],
            nestedKeyList.privateKeys[4],
            nestedKeyList.privateKeys[5]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMetadataKeyUpdate(response.tokenId, nestedKeyList.key);
    });

    it("(#8) Updates a mutable token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its metadata key", async function () {
      const thresholdKey = await JSONRPCRequest("generateKey", {
        type: "thresholdKey",
        threshold: 2,
        keys: [
          {
            type: "ed25519PrivateKey"
          },
          {
            type: "ecdsaSecp256k1PublicKey"
          },
          {
            type: "ed25519PublicKey"
          }
        ]
      });
      if (thresholdKey.status === "NOT_IMPLEMENTED") this.skip();

      const response = await JSONRPCRequest("updateToken", {
        tokenId: mutableTokenId,
        metadataKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenMetadataKeyUpdate(response.tokenId, thresholdKey.key);
    });

    it("(#9) Updates a mutable token with a valid key as its metadata key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          metadataKey: key,
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a mutable token with an invalid key as its metadata key", async function () {
      try {
        const response = await JSONRPCRequest("updateToken", {
          tokenId: mutableTokenId,
          metadataKey: crypto.randomBytes(88).toString("hex"),
          commonTransactionParams: {
            signers: [
              mutableTokenAdminKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  return Promise.resolve();
});
