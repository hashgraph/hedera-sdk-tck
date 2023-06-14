import {JSONRPCRequest} from "../../client.js";
import {expect} from "chai";

/**
 * Very basic test with hardcoded values. Setup doesn't need to be run
 */
describe('#generatePublicKey()', function () {
    it('should return the correct public key', async function () {
        let response = await JSONRPCRequest("generatePublicKey", {
                "privateKey": "302e020100300506032b657004220420c036915d924e5b517fae86ce34d8c76005cb5099798a37a137831ff5e3dc0622 "
            }
        )
        expect(response).to.equal('302a300506032b657003210008530ea4b75f639032eda3c18f41a296cf631d1828697e4f052297553139f347');
    });
});
