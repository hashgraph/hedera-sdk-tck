import { JSONRPCRequest } from "../../client.js";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { setOperator } from "../../setup_Tests.js";
import crypto, { verify } from "crypto";
import { assert, expect } from "chai";

// Needed to convert BigInts to JSON number format.
BigInt.prototype.toJSON = function () {
  return JSON.rawJSON(this.toString())
}

/**
 * Tests for TokenCreateTransaction
 */
describe("TokenCreateTransaction", function () {  
  // Tests should not take longer than 30 seconds to fully execute.
  this.timeout(30000);

  // Each test should first establish the network to use, and then teardown the network when complete.
  beforeEach(async function () {
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);
  });
  afterEach(async function () {
    await JSONRPCRequest("reset");
  });

  describe("Name", function () {
    async function verifyTokenCreationWithName(tokenId, name) {
      expect(name).to.equal(await consensusInfoClient.getTokenInfo(tokenId).name);
      expect(name).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].name);
    }

    it("(#1) Creates a token with a name that is a valid length", async function () {
      const name = "testname";
      const response = await JSONRPCRequest("createToken", {
        name: name,
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithName(response.tokenId, name);
    });

    it("(#2) Creates a token with a name that is the minimum length", async function () {
      const name = "t";
      const response = await JSONRPCRequest("createToken", {
        name: name,
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithName(response.tokenId, name);
    });

    it("(#3) Creates a token with a name that is empty", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "MISSING_TOKEN_NAME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#4) Creates a token with a name that is the maximum length", async function () {
      const name = "This is a really long name but it is still valid because it is 100 characters exactly on the money!!"
      const response = await JSONRPCRequest("createToken", {
        name: name,
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithName(response.tokenId, name);
    });

    it("(#5) Creates a token with a name that exceeds the maximum length", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "This is a long name that is not valid because it exceeds 100 characters and it should fail the test!!",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_NAME_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Creates a token with no name", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "MISSING_TOKEN_NAME");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Symbol", function () {
    async function verifyTokenCreationWithSymbol(tokenId, symbol) {
      expect(symbol).to.equal(await consensusInfoClient.getTokenInfo(tokenId).symbol);
      expect(symbol).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].symbol);
    }

    it("(#1) Creates a token with a symbol that is the minimum length", async function () {
      const symbol = "t";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: symbol,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithSymbol(response.tokenId, symbol);
    });

    it("(#2) Creates a token with a symbol that is empty", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "MISSING_TOKEN_SYMBOL");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#3) Creates a token with a symbol that is the maximum length", async function () {
      const symbol = "This is a really long symbol but it is still valid because it is 100 characters exactly on the money";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: symbol,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithSymbol(response.tokenId, symbol);
    });

    it("(#4) Creates a token with a symbol that exceeds the maximum length", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "This is a long symbol that is not valid because it exceeds 100 characters and it should fail the test",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_SYMBOL_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#5) Creates a token with no symbol", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "MISSING_TOKEN_SYMBOL");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Decimals", function () {
    async function verifyTokenCreationWithDecimals(tokenId, decimals) {
      expect(decimals).to.equal(await consensusInfoClient.getTokenInfo(tokenId).decimals);
      expect(decimals).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].decimals);
    }

    it("(#1) Creates a fungible token with a valid amount of decimals", async function () {
      const decimals = 3;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        decimals: decimals,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithDecimals(response.tokenId, decimals);
    });

    it("(#2) Creates a fungible token with the minimum amount of decimals", async function () {
      const decimals = 0;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        decimals: decimals,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithDecimals(response.tokenId, decimals);
    });

    it("(#3) Creates a fungible token with a decimal amount below the minimum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          decimals: -1,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_DECIMALS");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#4) Creates a fungible token with the maximum amount of decimals", async function () {
      const decimals = 2147483647;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        decimals: decimals,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithDecimals(response.tokenId, decimals);
    });

    it("(#5) Creates a fungible token with a decimal amount that exceeds the maximum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          decimals: 2147483648,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_DECIMALS");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Creates an NFT with a decimal amount of zero", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      const decimals = 0;
      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        decimals: decimals,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: key,
        tokenType: "nft"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      
      verifyTokenCreationWithDecimals(response.tokenId, decimals);
    });

    it("(#7) Creates an NFT with a nonzero decimal amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          decimals: 3,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          tokenType: "nft"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_DECIMALS");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("Initial Supply", function () {
    async function verifyTokenCreationWithInitialSupply(tokenId, initialSupply) {
      expect(initialSupply).to.equal(await consensusInfoClient.getTokenInfo(tokenId).totalSupply);
      expect(initialSupply).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].initial_supply);
    }

    it("(#1) Creates a fungible token with a valid initial supply", async function () {
      const initialSupply = 1000000;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        initialSupply: initialSupply,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithInitialSupply(response.tokenId, initialSupply);
    });

    it("(#2) Creates a fungible token with a valid initial supply and decimals", async function () {
      const decimals = 2;
      const initialSupply = 1000000;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        decimals: decimals,
        initialSupply: initialSupply,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithInitialSupply(response.tokenId, initialSupply / (10 ** decimals));
    });

    it("(#3) Creates a fungible token with a valid initial supply and more decimals", async function () {
      const decimals = 6;
      const initialSupply = 1000000;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        decimals: decimals,
        initialSupply: initialSupply,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithInitialSupply(response.tokenId, initialSupply / (10 ** decimals));
    });

    it("(#4) Creates a fungible token with the minimum initial supply", async function () {
      const initialSupply = 0;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        initialSupply: initialSupply,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithInitialSupply(response.tokenId, initialSupply);
    });

    it("(#5) Creates a fungible token with an initial supply below the minimum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          initialSupply: -1,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_INITIAL_SUPPLY");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#6) Creates a fungible token with the maximum initial supply", async function () {
      const initialSupply = 9223372036854775807n;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        initialSupply: initialSupply,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithInitialSupply(response.tokenId, initialSupply);
    });

    it("(#7) Creates a fungible token with an initial supply that exceeds the maximum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          initialSupply: 9223372036854775808n,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_INITIAL_SUPPLY");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#8) Creates an NFT with an initial supply of zero", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      const initialSupply = 0;
      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        initialSupply: initialSupply,
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: key,
        tokenType: "nft"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      
      verifyTokenCreationWithInitialSupply(response.tokenId, initialSupply);
    });

    it("(#9) Creates an NFT with an initial supply of zero without a supply key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          initialSupply: 0,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          tokenType: "nft"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_HAS_NO_SUPPLY_KEY");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#10) Creates an NFT with a nonzero initial supply", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          initialSupply: 3,
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          tokenType: "nft"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_INITIAL_SUPPLY");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("Treasury Account", function () {
    async function verifyTokenCreationWithTreasuryAccount(tokenId, treasuryAccountId) {
      expect(treasuryAccountId).to.equal(await consensusInfoClient.getTokenInfo(tokenId).treasuryAccountId.toString());
      expect(treasuryAccountId).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].treasury_account_id);
    }

    it("(#1) Creates a token with a treasury account", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: accountId,
        commonTransactionParams: {
          signers: [
            key
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithTreasuryAccount(response.tokenId, accountId);
    });

    it("(#2) Creates a token with a treasury account without signing with the account's private key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: key,
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: accountId
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#3) Creates a token with a treasury account that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: "123.456.789"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_ACCOUNT_ID");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it("(#4) Creates a token with a treasury account that is deleted", async function () {
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
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: accountId,
          commonTransactionParams: {
            signers: [
              key
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TREASURY_ACCOUNT_FOR_TOKEN");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("Admin Key", function () {
    async function verifyTokenCreationWithAdminKey(tokenId, adminKey) {
      expect(adminKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).adminKey.toStringDer());
      expect(adminKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].admin_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its admin key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        adminKey: publicKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithAdminKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its admin key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        adminKey: publicKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithAdminKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its admin key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        adminKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithAdminKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its admin key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        adminKey: privateKey,
        commonTransactionParams: {
          signers: [
            privateKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithAdminKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its admin key", async function () {
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

      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        adminKey: keyList.key,
        commonTransactionParams: {
          signers: [
            keyList.privateKeys[0],
            keyList.privateKeys[1],
            keyList.privateKeys[2],
            keyList.privateKeys[3]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithAdminKey(response.tokenId, keyList.key);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its admin key", async function () {
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

      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        adminKey: nestedKeyList.key,
        commonTransactionParams: {
          signers: [
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

      verifyTokenCreationWithAdminKey(response.tokenId, nestedKeyList.key);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its admin key", async function () {
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

      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        adminKey: thresholdKey.key,
        commonTransactionParams: {
          signers: [
            thresholdKey.privateKeys[0],
            thresholdKey.privateKeys[1]
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithAdminKey(response.tokenId, thresholdKey.key);
    });

    it("(#8) Creates a token with a valid key as its admin key but doesn't sign with it", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          adminKey: key
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#9) Creates a token with an invalid key as its admin key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          adminKey: crypto.randomBytes(88).toString("hex")
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
    async function verifyTokenCreationWithKycKey(tokenId, kycKey) {
      expect(kycKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).kycKey.toStringDer());
      expect(kycKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].kyc_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        kycKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithKycKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        kycKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithKycKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its KYC key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        kycKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithKycKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its KYC key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        kycKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithKycKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const keyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        kycKey: keyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithKycKey(response.tokenId, keyList);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const nestedKeyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        kycKey: nestedKeyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithKycKey(response.tokenId, nestedKeyList);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const thresholdKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        kycKey: thresholdKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithKycKey(response.tokenId, thresholdKey);
    });

    it("(#8) Creates a token with an invalid key as its KYC key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          kycKey: crypto.randomBytes(88).toString("hex")
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("Freeze Key", function () {
    async function verifyTokenCreationWithFreezeKey(tokenId, freezeKey) {
      expect(freezeKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).freezeKey.toStringDer());
      expect(freezeKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].freeze_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithFreezeKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithFreezeKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its freeze key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithFreezeKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its freeze key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithFreezeKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const keyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: keyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFreezeKey(response.tokenId, keyList);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const nestedKeyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: nestedKeyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFreezeKey(response.tokenId, nestedKeyList);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const thresholdKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: thresholdKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFreezeKey(response.tokenId, thresholdKey);
    });

    it("(#8) Creates a token with an invalid key as its freeze key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          freezeKey: crypto.randomBytes(88).toString("hex")
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
    async function verifyTokenCreationWithWipeKey(tokenId, wipeKey) {
      expect(wipeKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).wipeKey.toStringDer());
      expect(wipeKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].wipe_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        wipeKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithWipeKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        wipeKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithWipeKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its wipe key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        wipeKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithWipeKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its wipe key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        wipeKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithWipeKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const keyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        wipeKey: keyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithWipeKey(response.tokenId, keyList);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const nestedKeyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        wipeKey: nestedKeyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithWipeKey(response.tokenId, nestedKeyList);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const thresholdKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        wipeKey: thresholdKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithWipeKey(response.tokenId, thresholdKey);
    });

    it("(#8) Creates a token with an invalid key as its wipe key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          wipeKey: crypto.randomBytes(88).toString("hex")
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
    async function verifyTokenCreationWithSupplyKey(tokenId, supplyKey) {
      expect(supplyKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).supplyKey.toStringDer());
      expect(supplyKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].supply_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithSupplyKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithSupplyKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its supply key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithSupplyKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its supply key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithSupplyKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const keyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: keyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithSupplyKey(response.tokenId, keyList);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const nestedKeyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: nestedKeyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithSupplyKey(response.tokenId, nestedKeyList);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its supply key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const thresholdKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: thresholdKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithSupplyKey(response.tokenId, thresholdKey.key);
    });

    it("(#8) Creates a token with an invalid key as its supply key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyKey: crypto.randomBytes(88).toString("hex")
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Freeze Default", function () {
    async function verifyTokenCreationWithFreezeDefault(tokenId, freezeDefault) {
      expect(freezeDefault).to.equal(await consensusInfoClient.getTokenInfo(tokenId).freezeDefault);
      expect(freezeDefault).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].freeze_default);
    }

    it("(#1) Creates a token with a frozen default status", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      const freezeDefault = true;
      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeKey: key,
        freezeDefault: freezeDefault
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFreezeDefault(response.tokenId, freezeDefault);
    });

    it("(#2) Creates a token with a frozen default status and no freeze key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          freezeDefault: true
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_HAS_NO_FREEZE_KEY");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#3) Creates a token with an unfrozen default status", async function () {
      const freezeDefault = false;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        freezeDefault: freezeDefault
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFreezeDefault(response.tokenId, freezeDefault);
    });
  });

  describe("Expiration Time", function () {
    it("(#1) Creates a token with a valid expiration time", async function () {
      const expirationTimeSeconds = parseInt((Date.now() / 1000) + 5184000);
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        expirationTime: expirationTimeSeconds
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const tokenId = response.tokenId;

      expect(expirationTimeSeconds).to.equal(await consensusInfoClient.getTokenInfo(tokenId).expirationTime);
      expect(expirationTimeSeconds).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].expiry_timestamp);
    });

    it("(#2) Creates a token with an expiration time of one less than the current time", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          expirationTime: (Date.now() / 1000) - 1
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#3) Creates a token with an expiration time 8,000,002 seconds from the current time", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          expirationTime: (Date.now() / 1000) + 8000002
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_EXPIRATION_TIME");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Auto Renew Account", function () {
    it ("(#1) Creates a token with an auto renew account", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        autoRenewAccountId: accountId,
        commonTransactionParams: {
          signers: [
            key
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const tokenId = response.tokenId;

      expect(accountId).to.equal(await consensusInfoClient.getTokenInfo(tokenId).autoRenewAccountId.toString());
      expect(accountId).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].auto_renew_account);
    });

    it ("(#2) Creates a token with an auto renew account without signing with the account's key", async function () {
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
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          autoRenewAccountId: accountId
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_SIGNATURE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it ("(#3) Creates a token with an auto renew account that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          autoRenewAccountId: "123.456.789"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_AUTORENEW_ACCOUNT");
        return;
      }

      assert.fail("Should throw an error");
    });

    it ("(#4) Creates a token with an empty auto renew account", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          autoRenewAccountId: ""
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });

    it ("(#5) Creates a token with an auto renew account that is deleted", async function () {
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
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          autoRenewAccountId: accountId,
          commonTransactionParams: {
            signers: [
              key
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_AUTORENEW_ACCOUNT");
        return;
      }

      // The test failed, no error was thrown.
      assert.fail("Should throw an error");
    });
  });

  describe("Auto Renew Period", function () {
    async function verifyTokenCreationWithAutoRenewPeriod(tokenId, autoRenewPeriod) {
      expect(autoRenewPeriod).to.equal(await consensusInfoClient.getTokenInfo(tokenId).autoRenewPeriod);
      expect(autoRenewPeriod).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].auto_renew_period);
    }

    it ("(#1) Creates a token with an auto renew period set to 60 days (5,184,000 seconds)", async function () {
      const autoRenewPeriod = 5184000
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        autoRenewPeriod: autoRenewPeriod
      });

      verifyTokenCreationWithAutoRenewPeriod(response.tokenId, autoRenewPeriod);
    });

    it ("(#2) Creates a token with an auto renew period set to -1 seconds", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          autoRenewPeriod: -1
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }

      assert.fail("Should throw an error");
    });

    it ("(#3) Creates a token with an auto renew period set to the minimum period of 30 days (2,592,000 seconds)", async function () {
      const autoRenewPeriod = 2592000;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        autoRenewPeriod: autoRenewPeriod
      });

      verifyTokenCreationWithAutoRenewPeriod(response.tokenId, autoRenewPeriod);
    });

    it ("(#4) Creates a token with an auto renew period set to the minimum period of 30 days minus one second (2,591,999 seconds)", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          autoRenewPeriod: 2591999
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }

      assert.fail("Should throw an error");
    });

    it ("(#5) Creates a token with an auto renew period set to the maximum period of 8,000,001 seconds", async function () {
      const autoRenewPeriod = 8000001;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        autoRenewPeriod: autoRenewPeriod
      });

      verifyTokenCreationWithAutoRenewPeriod(response.tokenId, autoRenewPeriod);
    });

    it ("(#6) Creates a token with an auto renew period set to the maximum period plus one second (8,000,002 seconds)", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          autoRenewPeriod: 8000002
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_RENEWAL_PERIOD");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Memo", function () {
    async function verifyTokenCreationWithMemo(tokenId, memo) {
      expect(memo).to.equal(await consensusInfoClient.getTokenInfo(tokenId).memo);
      expect(memo).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].memo);
    }

    it ("(#1) Creates a token with a memo that is a valid length", async function () {
      const memo = "testmemo"
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        memo: memo
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMemo(response.tokenId, memo);
    });

    it ("(#2) Creates a token with a memo that is the minimum length", async function () {
      const memo = ""
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        memo: memo
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMemo(response.tokenId, memo);
    });

    it ("(#3) Creates a token with a memo that is the maximum length", async function () {
      const memo = "This is a really long memo but it is still valid because it is 100 characters exactly on the money!!"
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        memo: memo
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMemo(response.tokenId, memo);
    });

    it ("(#4) Creates a token with a memo that exceeds the maximum length", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          memo: "This is a long memo that is not valid because it exceeds 100 characters and it should fail the test!!"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "MEMO_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Token Type", function () {
    async function verifyTokenCreationWithTokenType(tokenId, type) {
      expect(type).to.equal(await consensusInfoClient.getTokenInfo(tokenId).type);
      expect(type).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].type);
    }

    it ("(#1) Creates a fungible token", async function () {
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        tokenType: "ft"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithTokenType(response.tokenId, "FUNGIBLE_COMMON");
    });

    it ("(#2) Creates an NFT", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });;
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: key,
        tokenType: "nft"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithTokenType(response.tokenId, "NON_FUNGIBLE_UNIQUE");
    });

    it ("(#3) Creates an NFT without a supply key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          tokenType: "nft"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_HAS_NO_SUPPLY_KEY");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Supply Type", function () {
    async function verifyTokenCreationWithSupplyType(tokenId, type) {
      expect(type).to.equal(await consensusInfoClient.getTokenInfo(tokenId).supplyType);
      expect(type).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].supply_type);
    }

    it ("(#1) Creates a token with a finite supply", async function () {
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyType: "finite",
        maxSupply: 1000000
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithSupplyType(response.tokenId, "FINITE");
    })

    it ("(#2) Creates a token with an infinite supply", async function () {
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyType: "infinite"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithSupplyType(response.tokenId, "INFINITE");
    })
  });

  describe("Max Supply", function () {
    async function verifyTokenCreationWithMaxSupply(tokenId, maxSupply) {
      expect(maxSupply).to.equal(await consensusInfoClient.getTokenInfo(tokenId).maxSupply);
      expect(maxSupply).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].max_supply);
    }

    it("(#1) Creates a fungible token with a valid max supply", async function () {
      const maxSupply = 1000000;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyType: "finite",
        maxSupply: maxSupply
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMaxSupply(response.tokenId, maxSupply);
    });

    it("(#2) Creates a fungible token with the minimum max supply", async function () {
      const maxSupply = 1;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyType: "finite",
        maxSupply: maxSupply
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMaxSupply(response.tokenId, maxSupply);
    });

    it("(#3) Creates a fungible token with a max supply below the minimum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyType: "finite",
          maxSupply: 0
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_MAX_SUPPLY");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#4) Creates a fungible token with the maximum max supply", async function () {
      const maxSupply = 9223372036854775807n;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyType: "finite",
        maxSupply: maxSupply
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMaxSupply(response.tokenId, maxSupply);
    });

    it("(#5) Creates a fungible token with a max supply that exceeds the maximum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyType: "finite",
          maxSupply: 9223372036854775808n
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_MAX_SUPPLY");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Creates a fungible token with a max supply and an infinite supply type", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          maxSupply: 1000000
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_MAX_SUPPLY");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#7) Creates an NFT with a max supply of zero", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyKey: key,
          supplyType: "finite",
          tokenType: "nft",
          maxSupply: 0
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_MAX_SUPPLY");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#8) Creates an NFT with a nonzero max supply", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      const maxSupply = 1000000;
      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: key,
        supplyType: "finite",
        tokenType: "nft",
        maxSupply: maxSupply
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMaxSupply(response.tokenId, maxSupply);
    });
  });

  describe("Fee Schedule Key", function () {
    async function verifyTokenCreationWithFeeScheduleKey(tokenId, feeScheduleKey) {
      expect(feeScheduleKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).feeScheduleKey.toStringDer());
      expect(feeScheduleKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].fee_schedule_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        feeScheduleKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithFeeScheduleKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        feeScheduleKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithFeeScheduleKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its fee schedule key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        feeScheduleKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithFeeScheduleKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its fee schedule key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        feeScheduleKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithFeeScheduleKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const keyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        feeScheduleKey: keyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFeeScheduleKey(response.tokenId, keyList);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const nestedKeyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        feeScheduleKey: nestedKeyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFeeScheduleKey(response.tokenId, nestedKeyList);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its fee schedule key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const thresholdKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        feeScheduleKey: thresholdKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFeeScheduleKey(response.tokenId, thresholdKey);
    });

    it("(#8) Creates a token with an invalid key as its fee schedule key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          feeScheduleKey: crypto.randomBytes(88).toString("hex")
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Custom Fees", function () {
    async function consensusNodeFeeEqualsCustomFee(customFee, feeCollectorAccountId, feeCollectorsExempt) {
      return feeCollectorAccountId === customFee.feeCollectorAccountId.toString() &&
             feeCollectorsExempt === customFee.allCollectorsAreExempt;
    }

    async function consensusNodeFeeEqualsCustomFixedFee(customFixedFee, feeCollectorAccountId, feeCollectorsExempt, amount) {
      return consensusNodeFeeEqualsCustomFee(customFixedFee, feeCollectorAccountId, feeCollectorsExempt) &&
             amount === customFixedFee.amount;
    }

    async function consensusNodeFeeEqualsCustomFractionalFee(customFractionalFee, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod) {
      return consensusNodeFeeEqualsCustomFee(customFractionalFee, feeCollectorAccountId, feeCollectorsExempt) &&
             numerator === customFractionalFee.numerator &&
             denominator === customFractionalFee.denominator &&
             minAmount === customFractionalFee.minimumAmount &&
             maxAmount === customFractionalFee.maximumAmount &&
             assessmentMethod === customFractionalFee.assessmentMethod.toString().toLowerCase();
    }

    async function consensusNodeFeeEqualsCustomRoyaltyFee(customRoyaltyFee, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fixedFeeCollectorAccountId, fixedFeeCollectorsExempt, fixedFeeAmount) {
      return consensusNodeFeeEqualsCustomFee(customRoyaltyFee, feeCollectorAccountId, feeCollectorsExempt) &&
             numerator === customRoyaltyFee.numerator &&
             denominator === customRoyaltyFee.denominator &&
             consensusNodeFeeEqualsCustomFixedFee(customRoyaltyFee.fallbackFee, fixedFeeCollectorAccountId, fixedFeeCollectorsExempt, fixedFeeAmount);
    }

    async function mirrorNodeFeeEqualsCustomFixedFee(customFixedFee, feeCollectorAccountId, amount) {
      return feeCollectorAccountId === customFixedFee.collector_account_id &&
             amount === customFixedFee.amount;
    }

    async function mirrorNodeFeeEqualsCustomFractionalFee(customFractionalFee, feeCollectorAccountId, numerator, denominator, minAmount, maxAmount, assessmentMethod) {
      return feeCollectorAccountId === customFractionalFee.collector_account_id &&
             numerator === customFractionalFee.amount.numerator &&
             denominator === customFractionalFee.amount.denominator &&
             minAmount === customFractionalFee.minimum &&
             maxAmount === customFractionalFee.maximum &&
             ((assessmentMethod === "exclusive") === customFractionalFee.net_of_transfer);
    }

    async function mirrorNodeFeeEqualsCustomRoyaltyFee(customRoyaltyFee, feeCollectorAccountId, numerator, denominator, fixedFeeAmount) {
      return feeCollectorAccountId === customRoyaltyFee.collector_account_id &&
             numerator === customRoyaltyFee.amount.numerator &&
             denominator === customRoyaltyFee.amount.denominator &&
             fixedFeeAmount === customRoyaltyFee.fallback_fee.amount;
    }

    async function verifyTokenCreationWithFixedFee(tokenId, feeCollectorAccountId, feeCollectorsExempt, amount) {
      const consensusNodeInfo = await consensusInfoClient.getTokenInfo(tokenId);
      const mirrorNodeInfo = await mirrorNodeClient.getTokenData(tokenId).tokens[0];

      let foundConsensusNodeFee = false;
      let foundMirrorNodeFee = false;

      for (let i = 0; i < consensusNodeInfo.customFees.size(); i++) {
        if (consensusNodeInfo.customFees[i] instanceof CustomFixedFee &&
            consensusNodeFeeEqualsCustomFixedFee(consensusNodeInfo.customFees[i], feeCollectorAccountId, feeCollectorsExempt, amount)) {
            foundConsensusNodeFee = true;
            break;
        }
      }

      for (let i = 0; i < mirrorNodeInfo.custom_fees.fixed_fees.size(); i++) {
        if (mirrorNodeFeeEqualsCustomFixedFee(mirrorNodeInfo.custom_fees.fixed_fees[i], feeCollectorAccountId, amount)) {
          foundMirrorNodeFee = true;
          break;
        }
      }
      
      expect(foundConsensusNodeFee).to.be.true;
      expect(foundMirrorNodeFee).to.be.true;
    }

    async function verifyTokenCreationWithFractionalFee(tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod) {
      const consensusNodeInfo = await consensusInfoClient.getTokenInfo(tokenId);
      const mirrorNodeInfo = await mirrorNodeClient.getTokenData(tokenId).tokens[0];

      let foundConsensusNodeFee = false;
      let foundMirrorNodeFee = false;

      for (let i = 0; i < consensusNodeInfo.customFees.size(); i++) {
        if (consensusNodeInfo.customFees[i] instanceof CustomFractionalFee &&
            consensusNodeFeeEqualsCustomFractionalFee(consensusNodeInfo.customFees[i], feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod)) {
            foundConsensusNodeFee = true;
            break;
        }
      }

      for (let i = 0; i < mirrorNodeInfo.custom_fees.fractional_fees.size(); i++) {
        if (mirrorNodeFeeEqualsCustomFractionalFee(mirrorNodeInfo.custom_fees.fractional_fees[i], feeCollectorAccountId, numerator, denominator, minAmount, maxAmount, assessmentMethod)) {
          foundMirrorNodeFee = true;
          break;
        }
      }
      
      expect(foundConsensusNodeFee).to.be.true;
      expect(foundMirrorNodeFee).to.be.true;
    }

    async function verifyTokenCreationWithRoyaltyFee(tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fixedFeeCollectorAccountId, fixedFeeCollectorsExempt, fixedFeeAmount) {
      const consensusNodeInfo = await consensusInfoClient.getTokenInfo(tokenId);
      const mirrorNodeInfo = await mirrorNodeClient.getTokenData(tokenId).tokens[0];

      let foundConsensusNodeFee = false;
      let foundMirrorNodeFee = false;

      for (let i = 0; i < consensusNodeInfo.customFees.size(); i++) {
        if (consensusNodeInfo.customFees[i] instanceof CustomRoyaltyFee &&
            consensusNodeFeeEqualsCustomRoyaltyFee(consensusNodeInfo.customFees[i], feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fixedFeeCollectorAccountId, fixedFeeCollectorsExempt, fixedFeeAmount)) {
            foundConsensusNodeFee = true;
            break;
        }
      }

      for (let i = 0; i < mirrorNodeInfo.custom_fees.fractional_fees.size(); i++) {
        if (mirrorNodeFeeEqualsCustomRoyaltyFee(mirrorNodeInfo.custom_fees.fractional_fees[i], feeCollectorAccountId, numerator, denominator, fixedFeeAmount)) {
          foundMirrorNodeFee = true;
          break;
        }
      }
      
      expect(foundConsensusNodeFee).to.be.true;
      expect(foundMirrorNodeFee).to.be.true;
    }

    it("(#1) Creates a token with a fixed fee", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const amount = 10;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fixedFee: {
              amount: amount
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFixedFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, amount);
    });

    it("(#2) Creates a token with a fractional fee", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fractionalFee: {
              numerator: numerator,
              denominator: denominator,
              minimumAmount: minAmount,
              maximumAmount: maxAmount,
              assessmentMethod: assessmentMethod
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFractionalFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod);
    });

    it("(#3) Creates a token with a royalty fee", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const amount = 10;
      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: key,
        tokenType: "nft",
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            royaltyFee: {
              numerator: numerator,
              denominator: denominator,
              fallbackFee: {
                feeCollectorAccountId: feeCollectorAccountId,
                feeCollectorsExempt: feeCollectorsExempt,
                amount: amount
              }
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithRoyaltyFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, feeCollectorAccountId, feeCollectorsExempt, amount);
    });

    it("(#4) Creates a token with a fee that has a fee collector account that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: "123.456.789",
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_CUSTOM_FEE_COLLECTOR");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#5) Creates a token with a fee with an empty fee collector account", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: "",
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Creates a token with a fee that has a deleted fee collector account", async function () {
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
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: accountId,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "ACCOUNT_DELETED");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#7) Creates a token with a fixed fee with the minimum amount", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const amount = 1;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fixedFee: {
              amount: amount
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFixedFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, amount);
    });

    it("(#8) Creates a token with a fixed fee with the amount below the minimum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 0
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#9) Creates a token with a fixed fee with the maximum amount", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const amount = 9223372036854775807n;
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fixedFee: {
              amount: amount
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFixedFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, amount);
    });

    it("(#10) Creates a token with a fixed fee with the amount above the maximum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 9223372036854775808n
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#11) Creates a token with a fixed fee that is assessed with the created token", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const amount = 10;
      const denominatingTokenId = "0.0.0";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fixedFee: {
              amount: amount,
              denominatingTokenId: denominatingTokenId
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFixedFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, amount);
    });

    it("(#12) Creates a token with a fixed fee that is assessed with a token that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [ {
            feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
            feeCollectorsExempt: false,
            fixedFee: {
              amount: 10,
              denominatingTokenId: "123.456.789"
            }
          }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID_IN_CUSTOM_FEES");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#13) Creates a token with a fixed fee that is assessed with an empty token", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10,
                denominatingTokenId: ""
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603, "Internal error");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#14) Creates a token with a fixed fee that is assessed with a deleted token", async function () {
      let response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const tokenId = response.tokenId;

      response = await JSONRPCRequest("deleteToken", {
        tokenId: tokenId
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10,
                denominatingTokenId: tokenId
              }
            }
          ]
        });
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID_IN_CUSTOM_FEES");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#15) Creates a token with a fractional fee with the minimum fractional amount", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 9223372036854775807n;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fractionalFee: {
              numerator: numerator,
              denominator: denominator,
              minimumAmount: minAmount,
              maximumAmount: maxAmount,
              assessmentMethod: assessmentMethod
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFractionalFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod);
    });

    it("(#16) Creates a token with a fractional fee with the amount below the minimum fractional amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 0,
                denominator: 9223372036854775807n,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#17) Creates a token with a fractional fee with the maximum fractional amount", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 9223372036854775807n;
      const denominator = 1;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fractionalFee: {
              numerator: numerator,
              denominator: denominator,
              minimumAmount: minAmount,
              maximumAmount: maxAmount,
              assessmentMethod: assessmentMethod
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFractionalFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod);
    });

    it("(#18) Creates a token with a fractional fee with the amount above the maximum fractional amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 9223372036854775808n,
                denominator: 1,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#19) Creates a token with a fractional fee with a 0 denominator", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 0,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "FRACTION_DIVIDES_BY_ZERO");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#20) Creates a token with a fractional fee with the minimum minimum amount", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 0;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fractionalFee: {
              numerator: numerator,
              denominator: denominator,
              minimumAmount: minAmount,
              maximumAmount: maxAmount,
              assessmentMethod: assessmentMethod
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFractionalFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod);
    });

    it("(#21) Creates a token with a fractional fee with the minimum amount below the minimum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: -1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#22) Creates a token with a fractional fee with the maximum maximum amount", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 9223372036854775807n;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fractionalFee: {
              numerator: numerator,
              denominator: denominator,
              minimumAmount: minAmount,
              maximumAmount: maxAmount,
              assessmentMethod: assessmentMethod
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFractionalFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod);
    });

    it("(#23) Creates a token with a fractional fee with the maximum amount above the maximum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 9223372036854775808n,
                assessmentMethod: "inclusive"
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#24) Creates a token with a fractional fee with the minimum amount higher than the maximum amount", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 10,
                maximumAmount: 1,
                assessmentMethod: "inclusive"
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#25) Creates a token with a fractional fee that is assessed to the receiver", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "exclusive";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fractionalFee: {
              numerator: numerator,
              denominator: denominator,
              minimumAmount: minAmount,
              maximumAmount: maxAmount,
              assessmentMethod: assessmentMethod
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithFractionalFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod);
    });

    it("(#26) Creates a token with a royalty fee with the minimum fractional amount", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 9223372036854775807n;
      const fallbackFeeAmount = 10;
      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        supplyKey: key,
        tokenType: "nft",
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            royaltyFee: {
              numerator: numerator,
              denominator: denominator,
              fallbackFee: {
                feeCollectorAccountId: feeCollectorAccountId,
                feeCollectorsExempt: feeCollectorsExempt,
                amount: fallbackFeeAmount
              }
            }
          }
        ]
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithRoyaltyFee(response.tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, feeCollectorAccountId, feeCollectorsExempt, fallbackFeeAmount);
    });

    it("(#27) Creates a token with a royalty fee with the amount below the minimum fractional amount", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyKey: key,
          tokenType: "nft",
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 0,
                denominator: 9223372036854775807n,
                fallbackFee: {
                  feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
                  feeCollectorsExempt: false,
                  amount: 10
                }
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#28) Creates a token with a royalty fee with the maximum fractional amount", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PrivateKey"
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyKey: key,
          tokenType: "nft",
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 9223372036854775807n,
                denominator: 1,
                fallbackFee: {
                  feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
                  feeCollectorsExempt: false,
                  amount: 10
                }
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "ROYALTY_FRACTION_CANNOT_EXCEED_ONE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#29) Creates a token with a royalty fee with the amount above the maximum fractional amount", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyKey: key,
          tokenType: "nft",
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 9223372036854775808n,
                denominator: 1,
                fallbackFee: {
                  feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
                  feeCollectorsExempt: false,
                  amount: 10
                }
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#30) Creates a token with a royalty fee with a 0 denominator", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          supplyKey: key,
          tokenType: "nft",
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 0,
                fallbackFee: {
                  feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
                  feeCollectorsExempt: false,
                  amount: 10
                }
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "FRACTION_DIVIDES_BY_ZERO");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#31) Creates a fungible token with a royalty fee", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallbackFee: {
                  feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
                  feeCollectorsExempt: false,
                  amount: 10
                }
              }
            }
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_ROYALTY_FEE_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#32) Creates a token with more than the maximum amount of fees allowed", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const amount = 10;
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          customFees: [
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
            {
              feeCollectorAccountId: feeCollectorAccountId,
              feeCollectorsExempt: feeCollectorsExempt,
              fixedFee: {
                amount: amount
              }
            },
          ]
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEES_LIST_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  describe("Pause Key", function () {
    async function verifyTokenCreationWithPauseKey(tokenId, pauseKey) {
      expect(pauseKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).pauseKey.toStringDer());
      expect(pauseKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].pause_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        pauseKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithPauseKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        pauseKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithPauseKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its pause key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        pauseKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithPauseKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its pause key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        pauseKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithPauseKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const keyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        pauseKey: keyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithPauseKey(response.tokenId, keyList);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const nestedKeyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        pauseKey: nestedKeyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithPauseKey(response.tokenId, nestedKeyList);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its pause key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const thresholdKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        pauseKey: thresholdKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithPauseKey(response.tokenId, thresholdKey);
    });

    it("(#8) Creates a token with an invalid key as its pause key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          pauseKey: crypto.randomBytes(88).toString("hex")
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
    async function verifyTokenCreationWithMetadata(tokenId, metadata) {
      expect(metadata).to.equal(await consensusInfoClient.getTokenInfo(tokenId).metadata);
      expect(metadata).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].metadata);
    }

    it("(#1) Creates a token with metadata", async function () {
      const metadata = "1234";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadata: metadata
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMetadata(response.tokenId, metadata);
    });

    it("(#2) Creates a token with empty metadata", async function () {
      const metadata = "";
      const response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadata: metadata
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMetadata(response.tokenId, metadata);
    });
  });

  describe("Metadata Key", function () {
    async function verifyTokenCreationWithMetadataKey(tokenId, metadataKey) {
      expect(metadataKey).to.equal(await consensusInfoClient.getTokenInfo(tokenId).metadataKey.toStringDer());
      expect(metadataKey).to.equal(await mirrorNodeClient.getTokenData(tokenId).tokens[0].metadata_key);
    }

    it("(#1) Creates a token with a valid ED25519 public key as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadataKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithMetadataKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#2) Creates a token with a valid ECDSAsecp256k1 public key as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ecdsaSecp256k1PublicKey"
      });
      const publicKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadataKey: publicKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithMetadataKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#3) Creates a token with a valid ED25519 private key as its metadata key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadataKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ED25519 public key DER-encoding has a 12 byte prefix.
      verifyTokenCreationWithMetadataKey(response.tokenId, String(publicKey).substring(24).toLowerCase());
    });

    it("(#4) Creates a token with a valid ECDSAsecp256k1 private key as its metadata key", async function () {
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

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadataKey: privateKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      // Compare against raw key, ECDSAsecp256k1 public key DER-encoding has a 14 byte prefix.
      verifyTokenCreationWithMetadataKey(response.tokenId, String(publicKey).substring(28).toLowerCase());
    });

    it("(#5) Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const keyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadataKey: keyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMetadataKey(response.tokenId, keyList.key);
    });

    it("(#6) Creates a token with a valid KeyList of nested Keylists (three levels) as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const nestedKeyList = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadataKey: nestedKeyList
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMetadataKey(response.tokenId, nestedKeyList.key);
    });

    it("(#7) Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its metadata key", async function () {
      let response = await JSONRPCRequest("generateKey", {
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
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const thresholdKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: "testname",
        symbol: "testsymbol",
        treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
        metadataKey: thresholdKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      verifyTokenCreationWithMetadataKey(response.tokenId, thresholdKey.key);
    });

    it("(#8) Creates a token with an invalid key as its metadata key", async function () {
      try {
        const response = await JSONRPCRequest("createToken", {
          name: "testname",
          symbol: "testsymbol",
          treasuryAccountId: process.env.OPERATOR_ACCOUNT_ID,
          metadataKey: crypto.randomBytes(88).toString("hex")
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
