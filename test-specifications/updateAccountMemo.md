# Update account memo - Test specification

## Description:

This test specification for update acount memo is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

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

const transaction = new AccountUpdateTransaction().setAccountId(accountId).setAccountMemo("test");
```

## Properties

### **Memo:**

- The Account memo of the created account

| Test no | Name                               | Input              | Expected response                                                       |
| ------- | ---------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| 1       | should test memo field is too long | 101 character memo | The account memo was not changed and correct error message was returned |
| 2       | should verify memo was updated     | 99 character memo  | The account memo was correctly changed                                  |
