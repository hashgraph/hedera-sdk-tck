# AccountUpdateTransaction - Test specification

## Description:
This test specification for AccountUpdateTransaction is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:
Each test within the test specification is linked to one of the properties within AccountUpdateTransaction. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error response code or seen as the result of node queries. A successful transaction (the transaction reached consensus and was applied to state) can be determined by getting a `TransactionReceipt` or `TransactionRecord`, or can be determined by using queries such as `AccountInfoQuery` or `AccountBalanceQuery` and investigating for the required changes (creations, updates, etc.). The mirror node can also be used to determine if a transaction was successful via its rest API. Error codes are obtained from the response code proto files.

**Transaction properties:**

https://docs.hedera.com/hedera/sdks-and-apis/sdks/accounts-and-hbar/update-an-account

**CryptoUpdate protobufs:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_update.proto

**Response codes:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto

**Mirror Node APIs:**

https://docs.hedera.com/hedera/sdks-and-apis/rest-api

## JSON-RPC API Endpoint Documentation

### Method Name

`updateAccount`

### Input Parameters

| Parameter Name            | Type         | Required/Optional | Description/Notes                                                                                                                          |
|---------------------------|--------------|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| accountId                 | string       | optional          | The ID of the account to update.                                                                                                           |
| key                       | string       | optional          | DER-encoded hex string representation for private or public keys. KeyLists and ThresholdKeys are the hex of the serialized protobuf bytes. |
| autoRenewPeriod           | int64        | optional          | Units of seconds                                                                                                                           |
| expirationTime            | int64        | optional          | Epoch time                                                                                                                                 |
| receiverSignatureRequired | bool         | optional          |                                                                                                                                            |
| memo                      | string       | optional          |                                                                                                                                            |
| maxAutoTokenAssociations  | int32        | optional          |                                                                                                                                            |
| stakedAccountId           | string       | optional          |                                                                                                                                            |
| stakedNodeId              | int64        | optional          |                                                                                                                                            |
| declineStakingReward      | bool         | optional          |                                                                                                                                            |
| signerKeys                | list<string> | optional          | List of DER-encoded hex strings of all additional private keys required to sign.                                                           |

### Output Parameters

| Parameter Name | Type   | Description/Notes                                                                     |
|----------------|--------|---------------------------------------------------------------------------------------|
| status         | string | The status of the submitted `AccountUpdateTransaction` (from a `TransactionReceipt`). |

### Additional Notes

The tests contained in this specification will assume that a valid account was already successfully created. Assume that the account was created with default values, unless specified otherwise. Any `<CREATED_ACCOUNT_ID>` tag will be the account ID of this created account. Any `<PRIVATE_KEY_OF_CREATED_ACCOUNT>` is the DER-encoded hex string of the private key of the account.

## Property Tests

### **Account ID:**

- The ID of the account to update.

| Test no | Name                                                                              | Input                                                                         | Expected response                                                                     | Implemented (Y/N) |
|---------|-----------------------------------------------------------------------------------|-------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account with no updates                                                | accountId=<CREATED_ACCOUNT_ID>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds.                                                          | N                 |
| 2       | Updates an account with no updates without signing with the account's private key | accountId=<CREATED_ACCOUNT_ID>                                                | The account creation fails with an INVALID_SIGNATURE response code from the network.  | N                 |
| 3       | Updates an account with no account ID                                             |                                                                               | The account creation fails with an INVALID_ACCOUNT_ID response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 541,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.15432"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 541,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Key:**

- The desired new key of the account.

| Test no | Name                                                                                                    | Input                                                                                                                                                                    | Expected response                                                                 | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account with a new valid ED25519 public key                                                  | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_ED25519_PUBLIC_KEY>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]                 | The account update succeeds and the account has the new ED25519 key.              | N                 |
| 2       | Updates an account with a new valid ECDSAsecp256k1 public key                                           | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <CORRESPONDING_VALID_ECDSA_SECP256K1_PRIVATE_KEY>] | The account update succeeds and the account has the new ECDSAsecp256k1 key.       | N                 |
| 3       | Updates an account with a new valid ED25519 private key                                                 | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_ED25519_PRIVATE_KEY>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <VALID_ED25519_PRIVATE_KEY>]                              | The account update succeeds and the account has the new ED25519 key.              | N                 |
| 4       | Updates an account with a new valid ECDSAsecp256k1 private key                                          | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <VALID_ECDSA_SECP256K1_PRIVATE_KEY>]              | The account update succeeds and the account has the new ECDSAsecp256k1 key.       | N                 |
| 5       | Updates an account with a new valid valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_KEYLIST>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <VALID_KEYLIST>]                                                      | The account update succeeds and the account has the new KeyList.                  | N                 |
| 6       | Updates an account with a new valid KeyList of nested KeyLists (three levels)                           | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_NESTED_KEYLIST>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <VALID_NESTED_KEYLIST>]                                        | The account update succeeds and the account has the new nested KeyList.           | N                 |
| 7       | Updates an account with a new valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys  | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_THRESHOLD_KEY>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <VALID_THRESHOLD_KEY>]                                          | The account update succeeds and the account has the new ThresholdKey.             | N                 |
| 8       | Updates an account with a new key without signing with the new key                                      | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_KEY>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                                                           | The account update fails with a INVALID_SIGNATURE response code from the network. | N                 |
| 9       | Updates an account with a new public key and signs with an incorrect private key                        | accountId=<CREATED_ACCOUNT_ID>, key=<VALID_PUBLIC_KEY>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>, <DIFFERENT_VALID_PRIVATE_KEY>]                                     | The account update fails with response code INVALID_SIGNATURE                     | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 538,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.768",
    "key": "302A300506032B6570032100EA746B07CFA75F9273BDC3F2495A43DE15720719DA6ED70AEC2D829ACC6A4ECD",
    "signerKeys": [
      "302E020100300506032B657004220420DE6788D0A09F20DED806F446C02FB929D8CD8D17022374AFB3739A1D50BA72C8",
      "302E020100300506032B657004220420C212D124233D70BA8F6F07BF01A44E98418799E3F8ABD2B42C69EC03B53A4E1B"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 538,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Auto Renew Period:**

- The desired new auto-renew period for the account. The account is charged to extend its expiration date every ‘this many’ seconds. If it doesn't have enough balance, it extends as long as possible. If it is empty when it expires, then it is deleted.

| Test no | Name                                                                                                                   | Input                                                                                                  | Expected response                                                                                | Implemented (Y/N) |
|---------|------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account with an auto renew period set to 60 days (5,184,000 seconds)                                        | accountId=<CREATED_ACCOUNT_ID>, autoRenewPeriod=5184000, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account's auto renew period should equal 5,184,000 seconds.  | N                 |
| 2       | Updates an account with an auto renew period set to -1 seconds                                                         | accountId=<CREATED_ACCOUNT_ID>, autoRenewPeriod=-1, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]      | The account update fails with an INVALID_RENEWAL_PERIOD response code from the network.          | N                 |
| 3       | Updates an account with an auto renew period set to the minimum period of 30 days (2,592,000 seconds)                  | accountId=<CREATED_ACCOUNT_ID>, autoRenewPeriod=2592000, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account's auto renew period should equal 2,592,000 seconds.  | N                 |
| 4       | Updates an account with an auto renew period set to the minimum period of 30 days minus one second (2,591,999 seconds) | accountId=<CREATED_ACCOUNT_ID>, autoRenewPeriod=2591999, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update fails with an AUTORENEW_DURATION_NOT_IN_RANGE response code from the network. | N                 |
| 5       | Updates an account with an auto renew period set to the maximum period of 8,000,001 seconds                            | accountId=<CREATED_ACCOUNT_ID>, autoRenewPeriod=8000001, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account's auto renew period should equal 8,000,001 seconds.  | N                 |
| 6       | Updates an account with an auto renew period set to the maximum period plus one seconds (8,000,002 seconds)            | accountId=<CREATED_ACCOUNT_ID>, autoRenewPeriod=8000002, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update fails with an AUTORENEW_DURATION_NOT_IN_RANGE response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 6412,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.32511",
    "autoRenewPeriod": 5184000,
    "signerKeys": [
      "302E020100300506032B657004220420DE6788D0A09F20DED806F446C02FB929D8CD8D17022374AFB3739A1D50BA72C8"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 6412,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Expiration Time:**

- The desired new expiration time of the account. This is the time at which the account will expire and attempt to extend its expiration date.

| Test no | Name                                                                                                                 | Input                                                                                                 | Expected response                                                                                 | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account with an expiration time set to 60 days (5,184,000 seconds)                                        | accountId=<CREATED_ACCOUNT_ID>, expirationTime=5184000, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account's auto renew period should equal 5,184,000 seconds.   | N                 |
| 2       | Updates an account with an expiration time set to -1 seconds                                                         | accountId=<CREATED_ACCOUNT_ID>, expirationTime=-1, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]      | The account update fails with an EXPIRATION_REDUCTION_NOT_ALLOWED response code from the network. | N                 |
| 3       | Updates an account with an expiration time set to the minimum period of 30 days (2,592,000 seconds)                  | accountId=<CREATED_ACCOUNT_ID>, expirationTime=2592000, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account's auto renew period should equal 2,592,000 seconds.   | N                 |
| 4       | Updates an account with an expiration time set to the minimum period of 30 days minus one second (2,591,999 seconds) | accountId=<CREATED_ACCOUNT_ID>, expirationTime=2591999, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update fails with an INVALID_EXPIRATION_TIME response code from the network.          | N                 |
| 5       | Updates an account with an expiration time set to the maximum period of 8,000,001 seconds                            | accountId=<CREATED_ACCOUNT_ID>, expirationTime=8000001, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account's auto renew period should equal 8,000,001 seconds.   | N                 |
| 6       | Updates an account with an expiration time set to the maximum period plus one seconds (8,000,002 seconds)            | accountId=<CREATED_ACCOUNT_ID>, expirationTime=8000002, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update fails with an INVALID_EXPIRATION_TIME response code from the network.          | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12137,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.8993",
    "expirationTime": 5184000,
    "signerKeys": [
      "302E020100300506032B657004220420C212D124233D70BA8F6F07BF01A44E98418799E3F8ABD2B42C69EC03B53A4E1B"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12137,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Receiver Signature Required:**

- The desired new receiver signature required policy for the account. If true, this account's key must sign any transaction depositing into this account (in addition to all withdrawals).

| Test no | Name                                                    | Input                                                                                                          | Expected response                                                                    | Implemented (Y/N) |
|---------|---------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account to require a receiving signature     | accountId=<CREATED_ACCOUNT_ID>, receiverSignatureRequired=true,  signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account creation succeeds and the account requires a receiving signature.        | N                 |
| 2       | Updates an account to not require a receiving signature | accountId=<CREATED_ACCOUNT_ID>, receiverSignatureRequired=false, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account creation succeeds and the account doesn't require a receiving signature. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 7546,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.5483",
    "receiverSignatureRequired": true,
    "signerKeys": [
      "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 7546,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Memo:**

- The desired new memo of the account (UTF-8 encoding max 100 bytes).

| Test no | Name                                                           | Input                                                                                                                                                                                       | Expected response                                                                                                                                                 | Implemented (Y/N) |
|---------|----------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account with a memo that is a valid length          | accountId=<CREATED_ACCOUNT_ID>, memo="testmemo", signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                                                                              | The account update succeeds and the account's memo equals “testmemo”.                                                                                             | N                 |
| 2       | Updates an account with a memo that is the minimum length      | accountId=<CREATED_ACCOUNT_ID>, memo="", signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                                                                                      | The account update succeeds and the account's memo is empty.                                                                                                      | N                 |
| 3       | Updates an account with a memo that is the maximum length      | accountId=<CREATED_ACCOUNT_ID>, memo="This is a really long memo but it is still valid because it is 100 characters exactly on the money!!", signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]  | The account update succeeds and the account's memo equals "This is a really long memo but it is still valid because it is 100 characters exactly on the money!!". | N                 |
| 4       | Updates an account with a memo that exceeds the maximum length | accountId=<CREATED_ACCOUNT_ID>, memo="This is a long memo that is not valid because it exceeds 100 characters and it should fail the test!!", signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update fails with a MEMO_TOO_LONG response code from the network.                                                                                     | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 5429,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.553",
    "memo": "testmemo",
    "signerKeys": [
      "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 5429,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Max Automatic Token Associations:**

- The new desired max automatic token associations for the account. The maximum number of tokens with which an account can be implicitly associated. Defaults to 0 and up to a maximum value of 5000.

| Test no | Name                                                                           | Input                                                                                                        | Expected response                                                                                                              | Implemented (Y/N) |
|---------|--------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account with a max token association that is a valid amount         | accountId=<CREATED_ACCOUNT_ID>, maxAutoTokenAssociations=100, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]  | The account update succeeds and the account has 100 automatic token associations.                                              | N                 |
| 2       | Updates an account with a max token association that is the minimum value      | accountId=<CREATED_ACCOUNT_ID>, maxAutoTokenAssociations=0, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]    | The account update succeeds and the account has 0 automatic token associations.                                                | N                 |
| 3       | Updates an account with a max token association that is the maximum value      | accountId=<CREATED_ACCOUNT_ID>, maxAutoTokenAssociations=5000, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account has 5000 automatic token associations.                                             | N                 |
| 4       | Updates an account with a max token association that exceeds the maximum value | accountId=<CREATED_ACCOUNT_ID>, maxAutoTokenAssociations=5001, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update fails with a REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12116,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.53671",
    "maxAutoTokenAssociations": 100,
    "signerKeys": [
      "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12116,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Staked ID:**

- The ID of the new desired account to which the account is staked.
    - OR
- The ID of the new desired node to which this account is staked.

| Test no | Name                                                                                  | Input                                                                                                                                                      | Expected response                                                                                   | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account with the staked account ID set to the operators account ID         | accountId=<CREATED_ACCOUNT_ID>, stakedAccountId=<OPERATOR_ACCOUNT_ID>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                       | The account update succeeds and the account has a staking account ID equal to the input account ID. | N                 |
| 2       | Updates an account with the staked node ID set to a valid node ID                     | accountId=<CREATED_ACCOUNT_ID>, stakedNodeId=<VALID_NETWORK_NODE_ID>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                        | The account update succeeds and the account has a staking node ID equal to the input node ID.       | N                 |
| 3       | Updates an account with the staked account ID set to an account ID that doesn't exist | accountId=<CREATED_ACCOUNT_ID>, stakedAccountId="123.456.789", signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                               | The account update fails with an INVALID_STAKING_ID response code from the network.                 | N                 |
| 4       | Updates an account with the staked node ID set to a node ID that doesn't exist        | accountId=<CREATED_ACCOUNT_ID>, stakedNodeId=123456789, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                                      | The account update fails with an INVALID_STAKING_ID response code from the network.                 | N                 |
| 5       | Updates an account with the staked account ID set to an empty account ID              | accountId=<CREATED_ACCOUNT_ID>, stakedAccountId="", signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                                          | The account update fails with and SDK internal error.                                               | N                 |
| 6       | Updates an account with the staked node ID set to an invalid node ID                  | accountId=<CREATED_ACCOUNT_ID>, stakedNodeId=-100, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]                                                           | The account update fails with an INVALID_STAKING_ID response code from the network.                 | N                 |
| 7       | Updates an account with a staked account ID and a staked node ID                      | accountId=<CREATED_ACCOUNT_ID>, stakedAccountId=<OPERATOR_ACCOUNT_ID>, stakedNodeId=<VALID_NETWORK_NODE_ID>, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update fails with an INVALID_STAKING_ID response code from the network.                 | N                 |

#### JSON Request Examples

```json
{
  "jsonrpc": "2.0",
  "id": 78190,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.7388",
    "stakedAccountId": "0.0.3",
    "signerKeys": [
      "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
    ]
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 78190,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.7388",
    "stakedNodeId": 10,
    "signerKeys": [
      "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 78190,
  "result": {
    "status": "SUCCESS"
  }
}
```

### **Decline Reward:**

- The new desired decline rewards policy for the account. If true, the account declines receiving a staking reward.

| Test no | Name                                                    | Input                                                                                                      | Expected response                                                            | Implemented (Y/N) |
|---------|---------------------------------------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|-------------------|
| 1       | Updates an account that declines staking rewards        | accountId=<CREATED_ACCOUNT_ID>, declineStakingRewards=true, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>]  | The account update succeeds and the account declines staking rewards.        | N                 |
| 2       | Updates an account that doesn't decline staking rewards | accountId=<CREATED_ACCOUNT_ID>, declineStakingRewards=false, signerKeys=[<PRIVATE_KEY_OF_CREATED_ACCOUNT>] | The account update succeeds and the account doesn't decline staking rewards. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 6539,
  "method": "updateAccount",
  "params": {
    "accountId": "0.0.983",
    "declineStakingRewards": true,
    "signerKeys": [
      "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 6539,
  "result": {
    "status": "SUCCESS"
  }
}
```
