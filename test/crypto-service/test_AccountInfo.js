import {JSONRPCRequest} from "../../client.js";
import {AccountId, Query, AccountInfoQuery} from "@hashgraph/sdk";
import consensusInfoClient from "../../consensusInfoClient.js";
import {expect} from "chai";
import {setOperator} from "../../setup_Tests.js";

let newAccountId;
let newPrivateKey;
let newPublicKey;
/**
 * Tests get account info parameters
 */
describe('#getAccountInfoTests', function () { // a suite of tests
  this.timeout(30000);

  // before and after hooks (normally used to set up and reset the client SDK)
  before(async function () {
      await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY)
  });
  after(async function () {
      await JSONRPCRequest("reset")
  });

  beforeEach(function () {
  });
  afterEach(function (done) {
      done();
  });    
    
  describe('Account info query tests', async function () {
    it('should create account and verify it', async function () {
        // Generate new private & public key
        newPrivateKey = await JSONRPCRequest("generatePrivateKey", {})
        newPublicKey = await JSONRPCRequest("generatePublicKey", {
            "privateKey": newPrivateKey
        });

        // CreateAccount with the JSON-RPC
        const response = await JSONRPCRequest("createAccount", {
            "publicKey": newPublicKey,
            "initialBalance": 1000
        });
        if(response.status === "NOT_IMPLEMENTED") this.skip()
        newAccountId = response.accountId

        // Check if account has been created and has 1000 tinyBar using the JS SDK Client
        const accountBalance = await consensusInfoClient.getBalance(newAccountId);
        const accountBalanceTinybars = BigInt(Number(accountBalance.hbars._valueInTinybar));
        expect(accountBalanceTinybars).to.equal(1000n);
    })

    it("should query instance of account info to/from bytes", async function () {
        const accountId = new AccountId(10);

        const query = Query.fromBytes(
            new AccountInfoQuery().setAccountId(accountId).toBytes()
        );

        expect(query instanceof AccountInfoQuery).to.be.true;

        expect(query.accountId.toString()).to.be.equal(accountId.toString());
    });
  })

  return Promise.resolve();
});
