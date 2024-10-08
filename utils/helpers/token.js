import { expect } from "chai";

import consensusInfoClient from "../../consensusInfoClient.js";
import mirrorNodeClient from "../../mirrorNodeClient.js";
import { JSONRPCRequest } from "../../client.js";

export const verifyTokenIsDeleted = async (tokenId) => {
  expect(await (await consensusInfoClient.getTokenInfo(tokenId)).isDeleted).to
    .be.true;

  expect(await (await mirrorNodeClient.getTokenData(tokenId)).deleted).to.be
    .true;
};

export const getNewFungibleTokenId = async (adminKey, treasuryAccountId) => {
  const tokenResponse = await JSONRPCRequest("createToken", {
    name: "testname",
    symbol: "testsymbol",
    adminKey: adminKey || process.env.OPERATOR_ACCOUNT_PRIVATE_KEY,
    treasuryAccountId: treasuryAccountId || process.env.OPERATOR_ACCOUNT_ID,
  });

  if (tokenResponse.status === "NOT_IMPLEMENTED") {
    this.skip();
  }

  return tokenResponse.tokenId;
};
