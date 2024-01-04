# Update account key - Test specification

## Description:

This test specification for update acount key is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:

Each test within the test specification is linked to one of the properties within AccountUpdateTransaction. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error or a results of node queries. Success on the consensus node can be obtained by a queries such as AccountInfoQuery or AccountBalanceQuery, and on the mirror node through the rest API. Error codes are obtained from the response code proto files.

**Transaction properties:**

[https://docs.hedera.com/hedera/sdks-and-apis/sdks/cryptocurrency/update-an-account](https://docs.hedera.com/hedera/sdks-and-apis/sdks/cryptocurrency/update-an-account)

**Crypto create protobufs:**

[https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_update.proto](https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_update.proto)

**Response codes:**

[https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto](https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto)

## Initialisation:

```jsx
new AccountUpdateTransaction();

//example

const transaction = new AccountUpdateTransaction().setAccountId(accountId).setKey(publicKey);
```

## Properties

### **Key:**

- The public key to update on the account

| Test no | Name                                                | Input                                                   | Expected response                     | Implemented (Y/N) |
| ------- | --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------- | ----------------- |
| 1       | should update key on an account via JSON-RPC server | accountId, newPublicKey, oldPrivateKey, newPrivateKey   | The account key was correctly updated |                   |
| 2       | should test transaction signature                   | accountId, samePublicKey, newPrivateKey, oldPrivateKey  | error message INVALID_SIGNATURE       |                   |
| 3       | should test for error in transaction signature      | accountId, wrongPublicKey, oldPrivateKey, newPrivateKey | error message INVALID_SIGNATURE       |                   |
