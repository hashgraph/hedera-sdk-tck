# Get account info - Test specification

## Description:
This test specification for get account info is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:
Each test within the test specification is linked to one of the properties within AccountInfoQuery. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error or a results of node queries. Success on the consensus node can be obtained by a queries such as AccountInfoQuery or AccountBalanceQuery, and on the mirror node through the rest API. Error codes are obtained from the response code proto files.

**Query properties:**

https://docs.hedera.com/hedera/sdks-and-apis/sdks/accounts-and-hbar/get-account-info

**Crypto get account info protobufs:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_get_info.proto

**Response codes:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto

## Initialisation:

```jsx
new AccountInfoQuery()

//example

const transaction = new AccountInfoQuery()
    .setAccountId(accountId)
```

## Properties

### **Account ID:**

- The ID of the account to query

| Test no | Name                                                | Input                 | Expected response                                                                     | Implemented (Y/N) |
|---------|-----------------------------------------------------|-----------------------|---------------------------------------------------------------------------------------|-------------------|
| 1       | Query for the info of an account                    | accountId             | The account info query succeeds and returns all correct information about the account | N                 |
| 2       | Query for the info of no account                    |                       | The account info query fails and returns error response INVALID_ACCOUNT_ID            | N                 |
| 3       | Query for the info of an account that doesn't exist | accountId=1000000.0.0 | The account info query fails and returns error response INVALID_ACCOUNT_ID            | N                 |
| 3       | Query for the info of an account that is deleted    | deletedAccountId      | The account info query fails and returns error response ACCOUNT_DELETED               | N                 |
