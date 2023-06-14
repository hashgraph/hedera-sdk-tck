import { JSONRPCRequest } from "../../client.js";
import { PublicKey } from "@hashgraph/sdk";
import consensusInfoClient from "../../consensusInfoClient.js";
import { expect, assert } from "chai";
import { setOperator } from "../../setup_Tests.js";

let accountId;
let firstPvtKey, firstPublicKey;    // generate first pair of keys for new account
let newPvtKey, newPublicKey;        // generate second pair of keys to test replacing keys
let randomPvtKey, randomPublicKey;  // a random pair to test authorisation failure for replacement

/**
 * Test to update the Public and Private keys on an account and compare results with js SDK
 */
 describe('#updateAccountKey()', function () { 
    this.timeout(30000); 

    before(async function () {
        await setOperator(process.env.OPERATOR_ACCOUNT_ID, process.env.OPERATOR_ACCOUNT_PRIVATE_KEY)
    });
    after(async function () {
        await JSONRPCRequest("reset")
    });

    // create a first set of Public / Private keys via JSON-RPC server for testing update of keys
    it('should create a new key set', async function () {
        firstPvtKey = await JSONRPCRequest("generatePrivateKey", {})
        firstPublicKey = await JSONRPCRequest("generatePublicKey", {
            "privateKey": firstPvtKey
        })
    });

    // create a second Public / Private key set for testing update of keys
    it('should create a second key set', async function () {
        newPvtKey = await JSONRPCRequest("generatePrivateKey", {})
        newPublicKey = await JSONRPCRequest("generatePublicKey", {
            "privateKey": newPvtKey
        })
    });

    // create a third Public / Private key set for testing invalid authorisation
    it('should create a second key set', async function () {
        randomPvtKey = await JSONRPCRequest("generatePrivateKey", {})
        randomPublicKey = await JSONRPCRequest("generatePublicKey", {
            "privateKey": randomPvtKey
        })
    });
   
    // create a new account using JSON-RPC using first public / private key set
    it('should create a new account', async function () {
        let response = await JSONRPCRequest("createAccount", {
            "publicKey": firstPublicKey
        })
        if(response.status === "NOT_IMPLEMENTED") this.skip()
        accountId = response.accountId;
    });    

    it('should retrieve first public key of newly created account', async function () {
        // Use the JS SDK Client to retrieve public key of new account
        let accountInfo = await consensusInfoClient.getAccountInfo(accountId);
        let firstKeySet = accountInfo.key;

        // Check if public key was successfully set
        expect(
            JSON.stringify(firstKeySet))
            .to.equal(
                JSON.stringify(PublicKey.fromString(firstPublicKey))
                );
    });    

    // update the PUBLIC & PRIVATE KEY SET on account via JSON-RPC
    it('should update key on an account via JSON-RPC server', async function () {
        await updateAccountKey(accountId, newPublicKey, firstPvtKey, newPvtKey);        
    });

    // update the PUBLIC & PRIVATE KEY SET on account via JSON-RPC
    it('should test transaction signature', async function () {
        /**
         * The transaction signature is not valid
         * INVALID_SIGNATURE = 7;
         */  
        try {
            await updateAccountKey(accountId, newPublicKey, firstPvtKey, newPvtKey); 
            
        } catch(err) {
            // If error is thrown then check error contains expected status message
            assert.equal(err.data.status, "INVALID_SIGNATURE");
        }        
    });

    // update the PUBLIC & PRIVATE KEY SET on account via JSON-RPC
    it('should test for error in transaction signature', async function () {
        try {
            await updateAccountKey(accountId, randomPublicKey, firstPvtKey, newPvtKey);
        } catch(err) {
            // If error is thrown then check error contains expected status code
            assert.equal(err.data.status, "INVALID_SIGNATURE");
            return
        }
        assert.fail("Should throw an error");
    });

    it('verify that key set updated', async function () {
        // Use the JS SDK Client to retrieve updated key field of account
        let accountInfo = await consensusInfoClient.getAccountInfo(accountId);
        let updatedPublicKey = accountInfo.key;

        // Check that key was successfully updated
        expect(
            JSON.stringify(updatedPublicKey))
            .to.equal(
                JSON.stringify(PublicKey.fromString(newPublicKey))
            );
    })
    // Another test in the same suite
    it('test that the two public keys were not the same', async function () {
        assert.notEqual(JSON.stringify(firstPublicKey), JSON.stringify(newPublicKey));
    })
});

async function updateAccountKey(accountId, newPublicKey, firstPvtKey, newPvtKey) {
    // sets a new public / private key on an account
    return await JSONRPCRequest("updateAccountKey", {
        "accountId": accountId,
        "newPublicKey": newPublicKey,
        "oldPrivateKey": firstPvtKey,
        "newPrivateKey": newPvtKey
    })
}
