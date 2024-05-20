# AccountDeleteTransaction - Test specification

## Description:
This test specification for the AccountDeleteTransaction is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:
Each test within the test specification is linked to one of the properties within AccountDeleteTransaction. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error or a results of node queries. Success on the consensus node can be obtained by a queries such as AccountInfoQuery or AccountBalanceQuery, and on the mirror node through the rest API. Error codes are obtained from the response code proto files.

**Transaction properties:**

https://docs.hedera.com/hedera/sdks-and-apis/sdks/cryptocurrency/delete-an-account

**CryptoDelete protobufs:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_delete.proto

**Response codes:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto

## Initialisation:

```jsx
new AccountDeleteTransaction()

//example

const transaction = new AccountDeleteTransaction()
  .setAccountId(accountId)
```

## Properties

### **AccountID:**

- The ID of the account to be deleted

| Test no | Name          | Input                                                | Expected response                                                       | Implemented (Y/N) |
|---------|---------------|------------------------------------------------------|-------------------------------------------------------------------------|-------------------|
| 1       | deleteAccount | AccountID to delete and a recipient of funds account | The account deletion succeeds. The recipient account received the funds |                   |
