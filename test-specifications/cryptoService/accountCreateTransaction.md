# AccountCreateTransaction - Test specification

## Description:
This test specification for AccountCreateTransaction is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:
Each test within the test specification is linked to one of the properties within AccountCreateTransaction. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error response code or seen as the result of node queries. Success on the consensus node can be obtained by a queries such as AccountInfoQuery or AccountBalanceQuery, and on the mirror node through the rest API. Error codes are obtained from the response code proto files.

**Transaction properties:**

https://docs.hedera.com/hedera/sdks-and-apis/sdks/accounts-and-hbar/create-an-account

**CryptoCreate protobufs:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_create.proto

**Response codes:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto

**Mirror Node APIs:**

https://docs.hedera.com/hedera/sdks-and-apis/rest-api

## Initialisation

```jsx
new AccountCreateTransaction()

//example

const transaction = new AccountCreateTransaction()
  .setKey(privateKey.publicKey)
  .setInitialBalance(new Hbar(1000))
  ...
```

## JSON-RPC API Endpoint Documentation

### Method Name

`createAccount`

### Parameters

| Parameter Name            | Type   | Required/Optional | Description/Notes                                                                                                                           |
|---------------------------|--------|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| key                       | string | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| initialBalance            | int64  | optional          | Units of tinybars                                                                                                                           |
| receiverSignatureRequired | bool   | optional          |                                                                                                                                             |
| autoRenewPeriod           | int64  | optional          | Units of seconds                                                                                                                            |
| memo                      | string | optional          |                                                                                                                                             |
| maxAutoTokenAssociations  | int32  | optional          |                                                                                                                                             |
| stakedAccountId           | string | optional          |                                                                                                                                             |
| stakedNodeId              | int64  | optional          |                                                                                                                                             |
| declineStakingReward      | bool   | optional          |                                                                                                                                             |
| alias                     | string | optional          | Hex string representation of a serialized protobuf Key of an ED25519 or ECDSAsecp256k1 public key type.                                     |

## Property Tests

### **Key:**

- The key for the new account.

| Test no | Name                                                                                          | Input                                   | Expected response                                                              | Implemented (Y/N) |
|---------|-----------------------------------------------------------------------------------------------|-----------------------------------------|--------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account with a valid ED25519 public key                                            | key=<VALID_ED25519_PUBLIC_KEY>          | The account creation succeeds.                                                 | N                 |
| 2       | Creates an account with a valid ECDSAsecp256k1 public key                                     | key=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>  | The account creation succeeds.                                                 | N                 |
| 3       | Creates an account with a valid ED25519 private key                                           | key=<VALID_ED25519_PRIVATE_KEY>         | The account creation succeeds.                                                 | N                 |
| 4       | Creates an account with a valid ECDSAsecp256k1 private key                                    | key=<VALID_ECDSA_SECP256K1_PRIVATE_KEY> | The account creation succeeds.                                                 | N                 |
| 5       | Creates an account with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys | key=<VALID_KEYLIST>                     | The account creation succeeds.                                                 | N                 |
| 6       | Creates an account with a valid KeyList of nested Keylists (three levels)                     | key=<VALID_NESTED_KEYLIST>              | The account creation succeeds.                                                 | N                 |
| 7       | Creates an account with no key                                                                |                                         | The account creation fails with a KEY_REQUIRED response code from the network. | N                 |
| 8       | Creates an account with an invalid key                                                        | key=<INVALID_KEY>                       | The account creation fails with an SDK internal error.                         | N                 |

### **Initial Balance:**

- The initial number of tinybars to put into the account.

| Test no | Name                                                                                | Input                                             | Expected response                                                                             | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account with an initial balance                                          | key=<VALID_KEY>, initialBalance=100               | The account creation succeeds and the account contains 100 tinybar.                           | N                 |
| 2       | Creates an account with a negative initial balance                                  | key=<VALID_KEY>, initialBalance=-1                | The account creation fails with an INVALID_INITIAL_BALANCE response code from the network.    | N                 |
| 3       | Creates an account with an initial balance higher than the operator account balance | key=<VALID_KEY>, initialBalance=1,000,000,000,000 | The account creation fails with an INSUFFICIENT_PAYER_BALANCE response code from the network. | N                 |

### **Receiver Signature Required:**

- If true, this account's key must sign any transaction depositing into this account (in addition to all withdrawals)..

| Test no | Name                                                                                       | Input                                                   | Expected response                                                                    | Implemented (Y/N) |
|---------|--------------------------------------------------------------------------------------------|---------------------------------------------------------|--------------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account that requires a receiving signature                                     | key=<VALID_PRIVATE_KEY>, receiverSignatureRequired=true | The account creation succeeds and the account requires a receiving signature.        | N                 |
| 2       | Creates an account that requires a receiving signature but isn't signed by the account key | key=<VALID_PUBLIC_KEY>, receiverSignatureRequired=true  | The account creation fails with an INVALID_SIGNATURE response code from the network. | N                 |

### **Auto Renew Period:**

- The account is charged to extend its expiration date every ‘this many’ seconds. If it doesn't have enough balance, it extends as long as possible. If it is empty when it expires, then it is deleted.

| Test no | Name                                                                            | Input                                    | Expected response                                                                                  | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------|------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account with an auto renew period set to 30 days (2,592,000 seconds) | key=<VALID_KEY>, autoRenewPeriod=2592000 | The account creation succeeds and the account's auto renew period should equal 2,592,000 seconds.  | N                 |
| 2       | Creates an account and set the auto renew period to -1 seconds                  | key=<VALID_KEY>, autoRenewPeriod=-1      | The account creation fails with an INVALID_RENEWAL_PERIOD response code from the network.          | N                 |
| 3       | Creates an account and set the auto renew period to 10 days (864,000 seconds)   | key=<VALID_KEY>, autoRenewPeriod=864000  | The account creation fails with an AUTORENEW_DURATION_NOT_IN_RANGE response code from the network. | N                 |

### **Memo:**

- The memo associated with the account (UTF-8 encoding max 100 bytes).

| Test no | Name                                                       | Input                                                                                                                                 | Expected response                                                               | Implemented (Y/N) |
|---------|------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account with a memo                             | key=<VALID_KEY>, memo="testmemo"                                                                                                      | The account creation succeeds and the account's memo equals “testmemo”.         | N                 |
| 2       | Creates an account with a memo that exceeds 100 characters | key=<VALID_KEY>, memo="this is a really long memo that definitely exceeds 100 characters and it should without a doubt fail the test" | The account creation fails with a MEMO_TOO_LONG response code from the network. | N                 |

### **Max Automatic Token Associations:**

- The maximum number of tokens with which an account can be implicitly associated. Defaults to 0 and up to a maximum value of 1000.

| Test no | Name                                                                       | Input                                          | Expected response                                                                                                                | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account with a max token association set to maximum value       | key=<VALID_KEY>, maxAutoTokenAssociations=1000 | The account creation succeeds and the account has 1000 automatic token associations.                                             | N                 |
| 2       | Creates an account with a max token association set over the maximum value | key=<VALID_KEY>, maxAutoTokenAssociations=1001 | The account creation fails with a REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT response code from the network. | N                 |

### **Staked ID:**

- ID of the account to which this account is staked.
  - OR
- ID of the node to which this account is staked.

| Test no | Name                                                                                  | Input                                                  | Expected response                                                                                     | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------------|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account with the staked account ID set to the operators account ID         | key=<VALID_KEY>, stakedAccountId=<OPERATOR_ACCOUNT_ID> | The account creation succeeds and the account has a staking account ID equal to the input account ID. | N                 |
| 2       | Creates an account with the staked node ID set to a valid node ID                     | key=<VALID_KEY>, stakedNodeId=<VALID_NETWORK_NODE_ID>  | The account creation succeeds and the account has a staking node ID equal to the input node ID.       | N                 |
| 3       | Creates an account with the staked account ID set to an account ID that doesn't exist | key=<VALID_KEY>, stakedAccountId=123.456.789           | The account creation fails with an INVALID_STAKING_ID response code from the network.                 | N                 |
| 4       | Creates an account with the staked node ID set to a node ID that doesn't exist        | key=<VALID_KEY>, stakedNodeId=123456789                | The account creation fails with an INVALID_STAKING_ID response code from the network.                 | N                 |
| 5       | Creates an account with the staked account ID set to an empty account ID              | key=<VALID_KEY>, stakedAccountId=""                    | The account creation fails with and SDK internal error.                                               | N                 |
| 6       | Creates an account with the staked account ID set to an invalid node ID               | key=<VALID_KEY>, stakedNodeId=-100                     | The account creation fails with an INVALID_STAKING_ID response code from the network.                 | N                 |

### **Decline rewards:**

- If true, the account declines receiving a staking reward.

| Test no | Name                                             | Input                                       | Expected response                                                       | Implemented (Y/N) |
|---------|--------------------------------------------------|---------------------------------------------|-------------------------------------------------------------------------|-------------------|
| 1       | Creates an account that declines staking rewards | key=<VALID_KEY>, declineStakingRewards=true | The account creation succeeds and the account declines staking rewards. | N                 |

### **Alias:**

- The bytes to be used as the account's alias. The bytes must be the serialization of a protobuf Key message for an ED25519/ECDSA_SECP256K1 primitive key type or, if the account is ECDSA_SECP256K1 based it may also be the public address, calculated as the last 20 bytes of the keccak-256 hash of the ECDSA_SECP256K1 primitive key.

| Test no | Name                                                       | Input                                                     | Expected response                                                                      | Implemented (Y/N) |
|---------|------------------------------------------------------------|-----------------------------------------------------------|----------------------------------------------------------------------------------------|-------------------|
| 1       | Creates an account with an ED25519 public key alias        | key=<VALID_KEY>, alias=<VALID_ED25519_PUBLIC_KEY>         | The account creation succeeds and the account has the ED25519 public key alias.        | N                 |
| 2       | Creates an account with an ECDSAsecp256k1 public key alias | key=<VALID_KEY>, alias=<VALID_ECDSA_SECP256K1_PUBLIC_KEY> | The account creation succeeds and the account has the ECDSAsecp256k1 public key alias. | N                 |
| 2       | Creates an account with an invalid public key alias        | key=<VALID_KEY>, alias=<INVALID_PUBLIC_KEY>               | The account creation fails with an INVALID_ALIAS_KEY response code from the network.   | N                 |

