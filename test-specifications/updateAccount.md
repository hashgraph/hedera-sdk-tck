# Update account - Test specification

## Description:

This test specification for updating an account is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:

Each test within the test specification is linked to one of the properties within AccountUpdateTransaction. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error or a results of node queries. Success on the consensus node can be obtained by a queries such as AccountInfoQuery or AccountBalanceQuery, and on the mirror node through the rest API. Error codes are obtained from the response code proto files.

**Transaction properties:**

https://docs.hedera.com/hedera/sdks-and-apis/sdks/accounts-and-hbar/update-an-account

**Crypto update protobufs:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_update.proto

**Response codes:**

[https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto](https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto)

## Initialisation:

```jsx
new AccountUpdateTransaction();

//example

const transaction = new AccountUpdateTransaction().setAccountId(accountId).setKey(publicKey);
```

## Properties

### **AccountId:**

- The ID of the account to update.

| Test no | Name                                                                             | Input                 | Expected response                                             | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------|-----------------------|---------------------------------------------------------------|-------------------|
| 1       | Update an account with no updates                                                | accountId, privateKey | The account update succeeds                                   | N                 |
| 2       | Update an account with no updates without signing with the account's private key | accountId             | The account update fails with response code INVALID_SIGNATURE | N                 |


### **Key:**

- The public key to update on the account.

| Test no | Name                                                                                                                 | Input                                                                | Expected response                                                      | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|------------------------------------------------------------------------|-------------------|
| 1       | Update an account with a new public ED25519 key                                                                      | accountId, oldPrivateKey, newPrivateKey, newPublicKey                | The account update succeeds and the account has the new key            | N                 |
| 2       | Update an account with a new public ECDSA key                                                                        | accountId, oldPrivateKey, newPrivateKey, newPublicKey                | The account update succeeds and the account has the new key            | N                 |
| 3       | Update an account key without signing with new private key                                                           | accountId, oldPrivateKey, newPublicKey                               | The account update fails with response code INVALID_SIGNATURE          | N                 |
| 4       | Update an account key and sign with incorrect private key                                                            | accountId, oldPrivateKey, wrongPrivateKey, newPublicKey              | The account update fails with response code INVALID_SIGNATURE          | N                 |
| 5       | Update an account key to an ECDSA threshold key and sign with the old key + threshold key                            | accountId, oldPrivateKey, thresholdPrivateKey, newThresholdPublicKey | The account update succeeds and the account has an ECDSA threshold key | N                 |
| 6       | Update an account key to an ED25519 threshold key and sign with the old key + threshokd key                          | accountId, oldPrivateKey, thresholdPrivateKey, newThresholdPublicKey | The account update succeeds and the account has an ECDSA threshold key | N                 |
| 7       | Update an account key that is composed of both ED25519+ ECSDA threshold key and sign with the old key + threshokd key| accountId, oldPrivateKey, thresholdPrivateKey, newThresholdPublicKey | The account update succeeds and the account has an ECDSA threshold key | N                 |

### **Auto Renew Period:**

- The account is charged to extend its expiration date every period of time. If it doesn't have enough balance, it extends as long as possible. If it is empty when it expires, then it is deleted.

| Test no | Name                                                                       | Input                                          | Expected response                                                           | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------|------------------------------------------------|-----------------------------------------------------------------------------|-------------------|
| 1       | Update an account with an auto renew period of 2,592,000 seconds (30 days) | accountId, privateKey, autoRenewPeriod=2592000 | The account update succeeds and the account has the new auto-renew period   | N                 |
| 2       | Update an account with an auto renew period of -1 seconds                  | accountId, privateKey, autoRenewPeriod=-1      | The account update fails with response code INVALID_RENEWAL_PERIOD          | N                 |
| 3       | Update an account with an auto renew period of 864,000 seconds (10 days)   | accountId, privateKey, autoRenewPeriod=864000  | The account update fails with response code AUTORENEW_DURATION_NOT_IN_RANGE | N                 |

### **Expiration Time:**

- The time at which the account will expire and attempt to extend its expiration date.

| Test no | Name                                                                                  | Input                                         | Expected response                                                        | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------------|-----------------------------------------------|--------------------------------------------------------------------------|-------------------|
| 1       | Update an account with an expiration time of 2,592,000 seconds (30 days) from runtime | accountId, privateKey, expirationTime=2592000 | The account update succeeds and the account has the new expiration time  | N                 |
| 2       | Update an account with an expiration time of -1 seconds from runtime                  | accountId, privateKey, expirationTime=-1      | The account update fails with response code INVALID_EXPIRATION_TIME      | N                 |

### **Receiver Signature Required:**

- If true, the account's key must sign any transaction depositing into the account (in addition to all withdrawals).

| Test no | Name                                                   | Input                                                  | Expected response                                                                        | Implemented (Y/N) |
|---------|--------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------------------------------------------|-------------------|
| 1       | Update an account to require a receiving signature     | accountId, privateKey, receiverSignatureRequired=true  | The account update succeeds and the account has receiverSignatureRequired equal to true  | N                 |
| 2       | Update an account to not require a receiving signature | accountId, privateKey, receiverSignatureRequired=false | The account update succeeds and the account has receiverSignatureRequired equal to false | N                 |


### **Memo:**

- The memo associated with the account (UTF-8 encoding max 100 bytes).

| Test no | Name                                                      | Input                                                                                                                                           | Expected response                                                 | Implemented (Y/N) |
|---------|-----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|-------------------|
| 1       | Update an account with a valid length memo                | accountId, privateKey, memo="test memo"                                                                                                         | The account update succeeds and the account has the new memo      | N                 |
| 2       | Update an account with a memo that exceeds 100 characters | accountId, privateKey, memo="this is a very long test memo that should not work and should cause the test to fail and return an error response" | The account update fails and returns error response MEMO_TOO_LONG | N                 |

### **Max Automatic Token Associations:**

- The maximum number of tokens with which the account can be implicitly associated. Defaults to 0 and up to a maximum value of 1000.

| Test no | Name                                                                                                              | Input                                                     | Expected response                                                                                                  | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Update an account to a valid association amount (500)                                                             | accountId, privateKey, maxAutomaticTokenAssociations=500  | The account update succeeds and the account maxAutomaticTokenAssociations equals 500                               | N                 |
| 2       | Update an account to the maximum max token association set to maximum value                                       | accountId, privateKey, maxAutomaticTokenAssociations=1000 | The account update succeeds and the account maxAutomaticTokenAssociations equals 1000                              | N                 |
| 3       | Update an account with a token association over the maximum value                                                 | accountId, privateKey, maxAutomaticTokenAssociations=1001 | The account update fails and returns error response REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT | N                 |
| 4       | Update an account with a token association (0) under the number of token associations the account already has (1) | accountId, privateKey, maxAutomaticTokenAssociations=0    | The account update fails and returns error response EXISTING_AUTOMATIC_ASSOCIATIONS_EXCEED_GIVEN_LIMIT             | N                 |                                                                                             |


### **Staked ID:**

- The ID of the account or node to which the account is staking.

| Test no | Name                                                                          | Input                                             | Expected response                                                                    | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------|---------------------------------------------------|--------------------------------------------------------------------------------------|-------------------|
| 1       | Update the staked account ID of an account to the operator's account ID       | accountId, privateKey, operatorAccountId          | The account update succeeds and has the operator account ID as its staked ID         | N                 |
| 2       | Update the staked node ID of an account to the testing node's ID              | accountId, privateKey, nodeId                     | The account update succeeds and has the testing node ID as its staked ID             | N                 |
| 3       | Update the staked account ID of an account to the sentinel account ID (0.0.0) | accountId, privateKey, sentinelAccountId=0.0.0    | The account update succeeds and has no staked ID                                     | N                 |
| 4       | Update the staked node ID of an account to the sentinel node ID (-1)          | accountId, privateKey, sentinelNodeId=-1          | The account update succeeds and has no staked ID                                     | N                 |
| 5       | Update the staked account ID of an account to an invalid ID                   | accountId, privateKey, invalidAccountId=10000.0.0 | The account update fails and returns error response INVALID_STAKING_ID               | N                 |
| 6       | Update the staked node ID of an account to an invalid ID                      | accountId, privateKey, invalidNodeId=10000        | The account update fails and returns error response INVALID_STAKING_ID               | N                 |
| 7       | Update the staked account ID of an account to its own account ID              | accountId, privateKey                             | The account update fails and returns error response SELF_STAKING_IS_NOT_ALLOWED      | N                 |

### **Decline Reward:**

- If true, the account declines receiving a staking reward.

| Test no | Name                                                       | Input                                                  | Expected response                                                             | Implemented (Y/N) |
|---------|------------------------------------------------------------|--------------------------------------------------------|-------------------------------------------------------------------------------|-------------------|
| 1       | Update an account to decline receiving staking rewards     | accountId, privateKey, declineReward=true              | The account update succeeds and the account has declineReward equal to true   | N                 |
| 2       | Update an account to not decline receiving staking rewards | accountId, privateKey, declineReward=false             | The account update succeeds and the account has declineReward equal to false  | N                 |
