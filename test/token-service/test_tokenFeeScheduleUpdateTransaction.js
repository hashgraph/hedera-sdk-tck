import { JSONRPCRequest } from "../../client.js";
import {
  CustomFixedFee,
  CustomFractionalFee,
  CustomRoyaltyFee
} from "@hashgraph/sdk";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { setOperator } from "../../setup_Tests.js";
import { assert, expect } from "chai";
import { retryOnError } from "../../utils/helpers/retry-on-error.js"


// Needed to convert BigInts to JSON number format.
BigInt.prototype.toJSON = function () {
  return JSON.rawJSON(this.toString())
}

/**
 * Tests for TokenFeeScheduleUpdateTransaction
 */
describe("TokenFeeScheduleUpdateTransaction", function () {  
  // Tests should not take longer than 30 seconds to fully execute.
  this.timeout(30000);

  // Initial token parameters.
  const testTokenName = "testname";
  const testTokenSymbol = "testsymbol";
  const testTreasuryAccountId = process.env.OPERATOR_ACCOUNT_ID;

  async function createToken(tokenType) {
    let response = await JSONRPCRequest("generateKey", {
      type: "ecdsaSecp256k1PrivateKey"
    });
    if (response.status === "NOT_IMPLEMENTED") return {key: "", tokenId: ""};
    const key = response.key;

    response = await JSONRPCRequest("createToken", {
      name: testTokenName,
      symbol: testTokenSymbol,
      treasuryAccountId: testTreasuryAccountId,
      tokenType: tokenType,
      feeScheduleKey: key,
      commonTransactionParams: {
        signers: [
          key
        ]
      }
    });
    if (response.status === "NOT_IMPLEMENTED") return {key: "", tokenId: ""};

    return {key: key, tokenId: response.tokenId};
  }

  // Create an immutable token.
  let fungibleTokenId, fungibleTokenFeeScheduleKey, nonFungibleTokenId, nonFungibleTokenFeeScheduleKey;

  before(async function () {
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);

    // Generate an immutable fungible token.
    let response = await JSONRPCRequest("generateKey", {
      type: "ecdsaSecp256k1PrivateKey"
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    fungibleTokenFeeScheduleKey = response.key;
  
    response = await JSONRPCRequest("createToken", {
      name: testTokenName,
      symbol: testTokenSymbol,
      treasuryAccountId: testTreasuryAccountId,
      tokenType: "ft",
      feeScheduleKey: fungibleTokenFeeScheduleKey,
      customFees: [
        {
          feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
          feeCollectorsExempt: false,
          fixedFee: {
            amount: 10
          }
        }
      ]
    });
    if (response.status === "NOT_IMPLEMENTED") this.skip();
    fungibleTokenId = response.tokenId;

    // Generate an immutable non-fungible token.
    response = await JSONRPCRequest("generateKey", {
      type: "ed25519PrivateKey"
    });
    nonFungibleTokenFeeScheduleKey = response.key;

    // Generate its supply key.
    response = await JSONRPCRequest("generateKey", {
      type: "ed25519PrivateKey"
    });
    const nftSupplyKey = response.key;
  
    response = await JSONRPCRequest("createToken", {
      name: testTokenName,
      symbol: testTokenSymbol,
      treasuryAccountId: testTreasuryAccountId,
      tokenType: "nft",
      supplyKey: nftSupplyKey,
      feeScheduleKey: nonFungibleTokenFeeScheduleKey
    });
    nonFungibleTokenId = response.tokenId;

    await JSONRPCRequest("reset");
  });

  beforeEach(async function () {
    await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY);
  });
  afterEach(async function () {
    await JSONRPCRequest("reset");
  });

  describe("Token ID", function () {
    async function verifyTokenFeeScheduleUpdate(tokenId) {
        let mirrorNodeData = await mirrorNodeClient.getTokenData(tokenId);
        let consensusNodeData = await consensusInfoClient.getTokenInfo(tokenId);
        expect(tokenId).to.be.equal(mirrorNodeData.token_id);
        expect(tokenId).to.be.equal(consensusNodeData.tokenId.toString());
    }

    it("(#1) Updates a token's fee schedule to be empty", async function () {
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdate(fungibleTokenId));
    });

    it("(#2) Updates a token's fee schedule to be empty when it is already empty", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES");
        return;
      }

      assert.fail("Should throw an error");
    });

    it.skip("(#3) Updates a token's fee schedule with a token ID that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: "123.456.789"
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#4) Updates a token's fee schedule with a token ID that isn't set", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: ""
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603);
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#5) Updates a token's fee schedule with a token ID that is deleted", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const key = response.key;

      response = await JSONRPCRequest("createToken", {
        name: testTokenName,
        symbol: testTokenSymbol,
        treasuryAccountId: testTreasuryAccountId,
        adminKey: key,
        commonTransactionParams: {
          signers: [key]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const tokenId = response.tokenId;

      response = await JSONRPCRequest("deleteToken", {
        tokenId: tokenId
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: tokenId
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "TOKEN_WAS_DELETED");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Updates a token's fee schedule with no token ID", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {});
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID");
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

    async function consensusNodeFeeEqualsCustomRoyaltyFee(customRoyaltyFee, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fixedFeeAmount) {
      return consensusNodeFeeEqualsCustomFee(customRoyaltyFee, feeCollectorAccountId, feeCollectorsExempt) &&
             numerator === customRoyaltyFee.numerator &&
             denominator === customRoyaltyFee.denominator &&
             fixedFeeAmount === customRoyaltyFee.fixedFeeAmount;
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

    async function verifyTokenFeeScheduleUpdateWithFixedFee(tokenId, feeCollectorAccountId, feeCollectorsExempt, amount) {
      const consensusNodeInfo = await consensusInfoClient.getTokenInfo(tokenId);
      const mirrorNodeInfo = await mirrorNodeClient.getTokenData(tokenId);

      let foundConsensusNodeFee = false;
      let foundMirrorNodeFee = false;

      for (let i = 0; i < consensusNodeInfo.customFees.length; i++) {
        if (consensusNodeInfo.customFees[i] instanceof CustomFixedFee &&
            consensusNodeFeeEqualsCustomFixedFee(consensusNodeInfo.customFees[i], feeCollectorAccountId, feeCollectorsExempt, amount)) {
            foundConsensusNodeFee = true;
            break;
        }
      }

      for (let i = 0; i < mirrorNodeInfo.custom_fees.fixed_fees.length; i++) {
        if (mirrorNodeFeeEqualsCustomFixedFee(mirrorNodeInfo.custom_fees.fixed_fees[i], feeCollectorAccountId, amount)) {
          foundMirrorNodeFee = true;
          break;
        }
      }
      
      expect(foundConsensusNodeFee).to.be.true;
      expect(foundMirrorNodeFee).to.be.true;
    }

    async function verifyTokenFeeScheduleUpdateWithFractionalFee(tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod) {
      const consensusNodeInfo = await consensusInfoClient.getTokenInfo(tokenId);
      const mirrorNodeInfo = await mirrorNodeClient.getTokenData(tokenId);

      let foundConsensusNodeFee = false;
      let foundMirrorNodeFee = false;

      for (let i = 0; i < consensusNodeInfo.customFees.length; i++) {
        if (consensusNodeInfo.customFees[i] instanceof CustomFractionalFee &&
            consensusNodeFeeEqualsCustomFractionalFee(consensusNodeInfo.customFees[i], feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod)) {
            foundConsensusNodeFee = true;
            break;
        }
      }

      for (let i = 0; i < mirrorNodeInfo.custom_fees.fractional_fees.length; i++) {
        if (mirrorNodeFeeEqualsCustomFractionalFee(mirrorNodeInfo.custom_fees.fractional_fees[i], feeCollectorAccountId, numerator, denominator, minAmount, maxAmount, assessmentMethod)) {
          foundMirrorNodeFee = true;
          break;
        }
      }
      
      expect(foundConsensusNodeFee).to.be.true;
      expect(foundMirrorNodeFee).to.be.true;
    }

    async function verifyTokenFeeScheduleUpdateWithRoyaltyFee(tokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fixedFeeAmount) {
      const consensusNodeInfo = await consensusInfoClient.getTokenInfo(tokenId);
      const mirrorNodeInfo = await mirrorNodeClient.getTokenData(tokenId);

      let foundConsensusNodeFee = false;
      let foundMirrorNodeFee = false;

      for (let i = 0; i < consensusNodeInfo.customFees.length; i++) {
        if (consensusNodeInfo.customFees[i] instanceof CustomRoyaltyFee &&
            consensusNodeFeeEqualsCustomRoyaltyFee(consensusNodeInfo.customFees[i], feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fixedFeeAmount)) {
            foundConsensusNodeFee = true;
            break;
        }
      }

      for (let i = 0; i < mirrorNodeInfo.custom_fees.royalty_fees.length; i++) {
        if (mirrorNodeFeeEqualsCustomRoyaltyFee(mirrorNodeInfo.custom_fees.royalty_fees[i], feeCollectorAccountId, numerator, denominator, fixedFeeAmount)) {
          foundMirrorNodeFee = true;
          break;
        }
      }
      
      expect(foundConsensusNodeFee).to.be.true;
      expect(foundMirrorNodeFee).to.be.true;
    }

    it("(#1) Updates a token's fee schedule with a fixed fee with an amount of 0", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 0
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#2) Updates a token's fee schedule with a fixed fee with an amount of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: -1
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#3) Updates a token's fee schedule with a fixed fee with an amount of 9,223,372,036,854,775,807 (int64 max)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const amount = 9223372036854775807n;
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fixedFee: {
              amount: amount
            }
          }
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFixedFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, amount));
    });

    it("(#4) Updates a token's fee schedule with a fixed fee with an amount of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const amount = 9223372036854775806n;
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            fixedFee: {
              amount: amount
            }
          }
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFixedFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, amount));
    });

    it("(#5) Updates a token's fee schedule with a fixed fee with an amount of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 9223372036854775808n
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#6) Updates a token's fee schedule with a fixed fee with an amount of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 18446744073709551615n
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#7) Updates a token's fee schedule with a fixed fee with an amount of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 18446744073709551614n
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#8) Updates a token's fee schedule with a fixed fee with an amount of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: -9223372036854775808n
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#9) Updates a token's fee schedule with a fixed fee with an amount of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: -9223372036854775807n
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#10) Updates a token's fee schedule with a fractional fee with a numerator of 0", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 0,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#11) Updates a token's fee schedule with a fractional fee with a numerator of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: -1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#12) Updates a token's fee schedule with a fractional fee with a numerator of 9,223,372,036,854,775,807 (int64 max)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 9223372036854775807n;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() =>
        verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#13) Updates a token's fee schedule with a fractional fee with a numerator of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 9223372036854775806n;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#14) Updates a token's fee schedule with a fractional fee with a numerator of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 9223372036854775808n,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#15) Updates a token's fee schedule with a fractional fee with a numerator of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 18446744073709551615n,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#16) Updates a token's fee schedule with a fractional fee with a numerator of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 18446744073709551614n,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#17) Updates a token's fee schedule with a fractional fee with a numerator of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: -9223372036854775808n,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#18) Updates a token's fee schedule with a fractional fee with a numerator of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: -9223372036854775807n,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#19) Updates a token's fee schedule with a fractional fee with a denominator of 0", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
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
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "FRACTION_DIVIDES_BY_ZERO");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#20) Updates a token's fee schedule with a fractional fee with a denominator of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: -1,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#21) Updates a token's fee schedule with a fractional fee with a denominator of 9,223,372,036,854,775,807 (int64 max)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 9223372036854775807n;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#22) Updates a token's fee schedule with a fractional fee with a denominator of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 9223372036854775806n;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#23) Updates a token's fee schedule with a fractional fee with a denominator of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 9223372036854775808n,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#24) Updates a token's fee schedule with a fractional fee with a denominator of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 18446744073709551615n,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#25) Updates a token's fee schedule with a fractional fee with a denominator of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 18446744073709551614n,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#26) Updates a token's fee schedule with a fractional fee with a denominator of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: -9223372036854775808n,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#27) Updates a token's fee schedule with a fractional fee with a denominator of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: -9223372036854775807n,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#28) Updates a token's fee schedule with a fractional fee with a minimum amount of 0", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 0;
      const maxAmount = 10;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#29) Updates a token's fee schedule with a fractional fee with a minimum amount of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
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
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#30) Updates a token's fee schedule with a fractional fee with a minimum amount of 9,223,372,036,854,775,807 (int64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 9223372036854775807n,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#31) Updates a token's fee schedule with a fractional fee with a minimum amount of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 9223372036854775806n,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#32) Updates a token's fee schedule with a fractional fee with a minimum amount of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 9223372036854775808n,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#33) Updates a token's fee schedule with a fractional fee with a minimum amount of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 18446744073709551615n,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#34) Updates a token's fee schedule with a fractional fee with a minimum amount of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 18446744073709551614n,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#35) Updates a token's fee schedule with a fractional fee with a minimum amount of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: -9223372036854775808n,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#36) Updates a token's fee schedule with a fractional fee with a minimum amount of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: -9223372036854775807n,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#37) Updates a token's fee schedule with a fractional fee with a maximum amount of 0", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 0;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#38) Updates a token's fee schedule with a fractional fee with a maximum amount of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: -1,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#39) Updates a token's fee schedule with a fractional fee with a maximum amount of 9,223,372,036,854,775,807 (int64 max)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 9223372036854775807n;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#40) Updates a token's fee schedule with a fractional fee with a maximum amount of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 9223372036854775806n;
      const assessmentMethod = "inclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#41) Updates a token's fee schedule with a fractional fee with a maximum amount of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
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
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#42) Updates a token's fee schedule with a fractional fee with a maximum amount of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 18446744073709551615n,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#43) Updates a token's fee schedule with a fractional fee with a maximum amount of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 18446744073709551614n,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#44) Updates a token's fee schedule with a fractional fee with a maximum amount of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: -9223372036854775808n,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#45) Updates a token's fee schedule with a fractional fee with a maximum amount of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: -9223372036854775807n,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#46) Updates a NFT's fee schedule with a royalty fee with a numerator of 0", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 0,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#47) Updates a NFT's fee schedule with a royalty fee with a numerator of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: -1,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#48) Updates a NFT's fee schedule with a royalty fee with a numerator of 9,223,372,036,854,775,807 (int64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 9223372036854775807n,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "ROYALTY_FRACTION_CANNOT_EXCEED_ONE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#49) Updates a NFT's fee schedule with a royalty fee with a numerator of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 9223372036854775806n,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "ROYALTY_FRACTION_CANNOT_EXCEED_ONE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#50) Updates a NFT's fee schedule with a royalty fee with a numerator of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 9223372036854775808n,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#51) Updates a NFT's fee schedule with a royalty fee with a numerator of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 18446744073709551615n,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#52) Updates a NFT's fee schedule with a royalty fee with a numerator of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 18446744073709551614n,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#53) Updates a NFT's fee schedule with a royalty fee with a numerator of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: -9223372036854775808n,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#54) Updates a NFT's fee schedule with a royalty fee with a numerator of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: -9223372036854775807n,
                denominator: 10,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#55) Updates a NFT's fee schedule with a royalty fee with a denominator of 0", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 0,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "FRACTION_DIVIDES_BY_ZERO");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#56) Updates a NFT's fee schedule with a royalty fee with a denominator of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: -1,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#57) Updates a NFT's fee schedule with a royalty fee with a denominator of 9,223,372,036,854,775,807 (int64 max)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 9223372036854775807n;
      const fallbackAmount = 10;
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: nonFungibleTokenId,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            royaltyFee: {
              numerator: numerator,
              denominator: denominator,
              fallbackFee: {
                amount: fallbackAmount
              }
            }
          }
        ],
        commonTransactionParams: {
          signers: [
            nonFungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithRoyaltyFee(nonFungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fallbackAmount));
    });

    it("(#58) Updates a NFT's fee schedule with a royalty fee with a denominator of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 9223372036854775806n;
      const fallbackAmount = 10;
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: nonFungibleTokenId,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            royaltyFee: {
              numerator: numerator,
              denominator: denominator,
              fallbackFee: {
                amount: fallbackAmount
              }
            }
          }
        ],
        commonTransactionParams: {
          signers: [
            nonFungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithRoyaltyFee(nonFungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fallbackAmount));
    });

    it("(#59) Updates a NFT's fee schedule with a royalty fee with a denominator of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 9223372036854775808n,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#60) Updates a NFT's fee schedule with a royalty fee with a denominator of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 18446744073709551615n,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#61) Updates a NFT's fee schedule with a royalty fee with a denominator of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 18446744073709551614n,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#62) Updates a NFT's fee schedule with a royalty fee with a denominator of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: -9223372036854775808n,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#63) Updates a NFT's fee schedule with a royalty fee with a denominator of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: -9223372036854775807n,
                fallback: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#64) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of 0", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallback: {
                  amount: 0
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#65) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of -1", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallback: {
                  amount: -1
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#66) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of 9,223,372,036,854,775,807 (int64 max)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const fallbackAmount = 9223372036854775807n;
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: nonFungibleTokenId,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            royaltyFee: {
              numerator: numerator,
              denominator: denominator,
              fallbackFee: {
                amount: fallbackAmount
              }
            }
          }
        ],
        commonTransactionParams: {
          signers: [
            nonFungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithRoyaltyFee(nonFungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fallbackAmount));
    });

    it("(#67) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of 9,223,372,036,854,775,806 (int64 max - 1)", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const fallbackAmount = 9223372036854775806n;
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: nonFungibleTokenId,
        customFees: [
          {
            feeCollectorAccountId: feeCollectorAccountId,
            feeCollectorsExempt: feeCollectorsExempt,
            royaltyFee: {
              numerator: numerator,
              denominator: denominator,
              fallbackFee: {
                amount: fallbackAmount
              }
            }
          }
        ],
        commonTransactionParams: {
          signers: [
            nonFungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithRoyaltyFee(nonFungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, fallbackAmount));
    });

    it("(#68) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of 9,223,372,036,854,775,808 (int64 max + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallback: {
                  amount: 9223372036854775808n
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#68) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of 18,446,744,073,709,551,615 (uint64 max)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallback: {
                  amount: 18446744073709551615n
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#70) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of 18,446,744,073,709,551,614 (uint64 max - 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallback: {
                  amount: 18446744073709551614n
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#71) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of -9,223,372,036,854,775,808 (int64 min)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallback: {
                  amount: -9223372036854775808n
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#72) Updates a NFT's fee schedule with a royalty fee with a fallback fee with an amount of -9,223,372,036,854,775,807 (int64 min + 1)", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallback: {
                  amount: -9223372036854775807n
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEE_MUST_BE_POSITIVE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#73) Updates a token's fee schedule with a fixed fee with a fee collector account that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: "123.456.789",
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_CUSTOM_FEE_COLLECTOR");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#74) Updates a token's fee schedule with a fractional with a fee collector account that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: "123.456.789",
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_CUSTOM_FEE_COLLECTOR");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#75) Updates a NFT's fee schedule with a royalty fee with a fee collector account that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: "123.456.789",
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallbackFee: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_CUSTOM_FEE_COLLECTOR");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#76) Updates a token's fee schedule with a fixed fee with an empty fee collector account", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: "",
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603);
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#77) Updates a token's fee schedule with a fractional with an empty fee collector account", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: "",
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603);
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#78) Updates a NFT's fee schedule with a royalty fee with an empty fee collector account", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: "",
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallbackFee: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603);
        return;
      }

      assert.fail("Should throw an error");
    });

    it.skip("(#79) Updates a token's fee schedule with a fixed fee with a deleted fee collector account", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountKey = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: accountKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: accountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
          signers: [
            accountKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: accountId,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_CUSTOM_FEE_COLLECTOR");
        return;
      }

      assert.fail("Should throw an error");
    });

    it.skip("(#80) Updates a token's fee schedule with a fractional fee with a deleted fee collector account", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountKey = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: accountKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: accountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
          signers: [
            accountKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: accountId,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_CUSTOM_FEE_COLLECTOR");
        return;
      }

      assert.fail("Should throw an error");
    });

    it.skip("(#81) Updates a NFT's fee schedule with a royalty fee with a deleted fee collector account", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountKey = response.key;

      response = await JSONRPCRequest("createAccount", {
        key: accountKey
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const accountId = response.accountId;

      response = await JSONRPCRequest("deleteAccount", {
        deleteAccountId: accountId,
        transferAccountId: process.env.OPERATOR_ACCOUNT_ID,
        commonTransactionParams: {
          signers: [
            accountKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: accountId,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallbackFee: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_CUSTOM_FEE_COLLECTOR");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#82) Updates a token's fee schedule with a fixed fee that is assessed with a token that doesn't exist", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10,
                denominatingTokenId: "123.456.789"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID_IN_CUSTOM_FEES");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#83) Updates a token's fee schedule with a fixed fee that is assessed with an empty token", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10,
                denominatingTokenId: ""
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.code, -32603);
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#84) Updates a token's fee schedule with a fixed fee that is assessed with a deleted token", async function () {
      let response = await JSONRPCRequest("generateKey", {
        type: "ed25519PrivateKey"
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const deleteKey = response.key;

      response = await JSONRPCRequest("createToken", {
        name: testTokenName,
        symbol: testTokenSymbol,
        treasuryAccountId: testTreasuryAccountId,
        adminKey: deleteKey,
        commonTransactionParams: {
          signers: [deleteKey]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();
      const deleteTokenId = response.tokenId;

      response = await JSONRPCRequest("deleteToken", {
        tokenId: deleteTokenId,
        commonTransactionParams: {
          signers: [
            deleteKey
          ]
        }
      })
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10,
                denominatingTokenId: deleteTokenId
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "INVALID_TOKEN_ID_CUSTOM_FEES");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#85) Updates a token's fee schedule with a fractional fee that is assessed to the receiver", async function () {
      const feeCollectorAccountId = process.env.OPERATOR_ACCOUNT_ID;
      const feeCollectorsExempt = false;
      const numerator = 1;
      const denominator = 10;
      const minAmount = 1;
      const maxAmount = 10;
      const assessmentMethod = "exclusive";
      const response = await JSONRPCRequest("updateTokenFeeSchedule", {
        tokenId: fungibleTokenId,
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
        ],
        commonTransactionParams: {
          signers: [
            fungibleTokenFeeScheduleKey
          ]
        }
      });
      if (response.status === "NOT_IMPLEMENTED") this.skip();

      await retryOnError(() => verifyTokenFeeScheduleUpdateWithFractionalFee(fungibleTokenId, feeCollectorAccountId, feeCollectorsExempt, numerator, denominator, minAmount, maxAmount, assessmentMethod));
    });

    it("(#86) Updates a fungible token's fee schedule with a royalty fee", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              royaltyFee: {
                numerator: 1,
                denominator: 10,
                fallbackFee: {
                  amount: 10
                }
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_ROYALTY_FEE_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#87) Updates a NFT's fee schedule with a fractional fee", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: nonFungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fractionalFee: {
                numerator: 1,
                denominator: 10,
                minimumAmount: 1,
                maximumAmount: 10,
                assessmentMethod: "inclusive"
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              nonFungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FRACTIONAL_FEE_ONLY_ALLOWED_FOR_FUNGIBLE_COMMON");
        return;
      }

      assert.fail("Should throw an error");
    });

    it("(#88) Updates a token's fee schedule with more than the maximum amount of fees allowed", async function () {
      try {
        const response = await JSONRPCRequest("updateTokenFeeSchedule", {
          tokenId: fungibleTokenId,
          customFees: [
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            },
            {
              feeCollectorAccountId: process.env.OPERATOR_ACCOUNT_ID,
              feeCollectorsExempt: false,
              fixedFee: {
                amount: 10
              }
            }
          ],
          commonTransactionParams: {
            signers: [
              fungibleTokenFeeScheduleKey
            ]
          }
        });
        if (response.status === "NOT_IMPLEMENTED") this.skip();
      } catch (err) {
        assert.equal(err.data.status, "CUSTOM_FEES_LIST_TOO_LONG");
        return;
      }

      assert.fail("Should throw an error");
    });
  });

  return Promise.resolve();
});
