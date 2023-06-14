# Create account - Test specification

## Description:
This test specification for account creation is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:
Each test within the test specification is linked to one of the properties within AccountCreateTransaction. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error or a results of node queries. Success on the consensus node can be obtained by a queries such as AccountInfoQuery or AccountBalanceQuery, and on the mirror node through the rest API. Error codes are obtained from the response code proto files.

**Transaction properties:**

[https://docs.hedera.com/guides/docs/sdks/cryptocurrency/create-an-account](https://docs.hedera.com/guides/docs/sdks/cryptocurrency/create-an-account)

**Crypto create protobufs:**

[https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_create.proto](https://github.com/hashgraph/hedera-protobufs/blob/main/services/crypto_create.proto)

**Response codes:**

[https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto](https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto)

## Initialisation:

```jsx
new AccountCreateTransaction()

//example

const transaction = new AccountCreateTransaction()
  .setKey(privateKey.publicKey)
  .setInitialBalance(new Hbar(1000))
```

## Properties

### **Key:**

- The PublicKey for the new account

| Test no | Name                                         | Input                                                         | Expected response                                                                                                                                               |
| ------- | -------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Simple account creation                      | A public key with all other fields at default values          | The account creation succeeds. The account can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |
| 2       | Create an account with no public key         | All fields default with no public key                         | The account creation fails with a response of KEY_NOT_PROVIDED                                                                                                  |
| 3       | Create an account with an invalid public key | An invalid public key with all other fields at default values | The account creation fails with an error response of :                                                                                                          |


### **Initial Balance:**

- The initial number of tinybars to put into the account

| Test no | Name                                                              | Input                                                                                  | Expected response                                                                                                                                                                               |
| ------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Create an account and set the initial balance                     | A public key and the initial balance set to 100 hbar                                   | The account creation succeeds with a balance of 100 Hbar. The account can be queried on the consensus node with AccountBalanceQuery, and on mirror node using the REST API, within 10 seconds   |
| 2       | Set the initial balance of the new account to a negative number   | A public key and the initial balance set to -1 Hbar                                    | The account creation should fail and return error response - INVALID_INITIAL_BALANCE                                                                                                            |
| 3       | Set the initial balance to more than the operator account balance | A public key and the initial balance set to a balance higher than the operator account | The account creation should fail and return error response - INSUFFICIENT_PAYER_BALANCE                                                                                                         |

### **Receiver Signature Required:**

- If true, this account's key must sign any transaction depositing into this account
  (in addition to all withdrawals)

| Test no | Name                                                                  | Input                                                                                                      | Expected response                                                                                                                                                                                                |
| ------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Require a receiving signature when creating a new account transaction | A public key, an valid initial balance of 100 Hbars and set Receiver Signature Required to “True”          | The account creation succeeds. The accounts isReceiverSignatureRequired should equal true, can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds  |
| 2       | Create a new account transaction that doesn’t require a signature     | A public key, an valid initial balance of 100 Hbars and set Receiver Signature Required to “False” or none | The account creation succeeds. The accounts isReceiverSignatureRequired should equal false, can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |

### **Max Automatic Token Associations:**

- The maximum number of tokens that an Account can be implicitly associated with. Defaults to 0
  and up to a maximum value of 1000.

| Test no | Name                                                                | Input                                                | Expected response                                                                                                                                                                              |
| ------- | ------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Create an account with a default max token association              | A public key with all other fields at default values | The account creation succeeds. The accounts maxAutomaticTokenAssociations can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |
| 2       | Create an account with a max token association set to maximum value | A public key and a max token association of 1000     | The account creation succeeds. The accounts maxAutomaticTokenAssociations can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |
| 3       | Create an account with a token association over the maximum value   | A public key and a max token association of 1001     | The account creation should fail and return error response - REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT                                                                    |
| 4       | Create an account with a max token association of -1                | A public key and a max token association of -1       | The account creation should fail and return error response - INVALID_TOKEN_INITIAL_SUPPLY                                                                                                      |


### **Staked ID:**

- ID of the account to which this account is staking
  - OR
- ID of the node this account is staked to.

| Test no | Name                                                                        | Input                                                     | Expected response                                                                                                                                                                                                                  |
| ------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Create an account and set the staked account ID to the operators account ID | A public key and the operators account ID                 | The account creation succeeds. The accounts stakingInfo.stakedAccountID should equal the operator account. It can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |
| 2       | Create an account and set the staked node ID a node ID                      | A public key and the node ID                              | The account creation succeeds. The accounts stakingInfo.stakedNodeID should equal the node ID. It can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds             |
| 3       | Create an account and set the staked account ID to an invalid ID            | A public key and a staked account ID                      | The account creation should fail and return error response - INVALID_STAKING_ID                                                                                                                                                    |
| 4       | Create an account and set the staked node ID to an invalid node             | A public key and a staked node ID                         | The account creation should fail and return error response - INVALID_STAKING_ID                                                                                                                                                    |
| 5       | Create an account and set the staked account ID with no input               | A public key and an staked account ID with an empty value | The account creation should fail and return an error response                                                                                       |
| 6       | Create an account and set the staked node ID with no input                  | A public key and an staked node ID with an empty value    | The account creation should fail and return an error response                                                                                      |
| 7       | Create an account and set both a staking account ID and Node ID             | A public key, a stoked account Id and Node ID             | The account creation should fail and return an error response                                                                                                                                                                 |

### **Decline rewards:**

- If true, the account declines receiving a staking reward. The default value is false.

| Test no | Name                                                             | Input                                                | Expected response                                                                                                                                                                                                      |
| ------- | ---------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Create an account and set the account to decline staking rewards | A public key and decline rewards set to “true”       | The account creation succeeds. The accounts stakingInfo.declineStakingReward should equal “true” can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds  |
| 2       | Create an account and leave decline rewards at default value     | A public key with all other fields at default values | The account creation succeeds. The accounts stakingInfo.declineStakingInfo should equal false. It can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |
| 3       | Create an account and set the decline rewards value to 5         | a public key and decline rewards set to 5            | The account creation should fail and return error response - INVALID_TRANSACTION                                                                                                                                       |

### **Memo:**

- The memo associated with the account (UTF-8 encoding max 100 bytes)

| Test no | Name                                                      | Input                                    | Expected response                                                                                                                                                                             |
| ------- | --------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Create an account with a memo                             | A public key and a memo value of “testmemo”  | The account creation succeeds. The accounts memo should equal “testmemo”. It can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |
| 2       | Create an account with a memo that exceeds 100 characters | A public key and a memo > 100 characters | The account creation should fail and return error response - MEMO_TOO_LONG                                                                                                                    |

### **Auto Renew Period:** 

- The account is charged to extend its expiration date every ‘this many’ seconds. If it doesn't
  have enough balance, it extends as long as possible. If it is empty when it expires, then it
  is deleted.

| Test no | Name                                                                           | Input                                                   | Expected response                                                                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Create an account and set the auto renew period to 30 days (2,592,000 seconds) | A public key and 2592000 as the auto renew period value | The account creation succeeds. The accounts auto renew period should equal 2,592,000. It can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds |
| 2       | Create an account and set the auto renew period to -1                          | A public key and -1 as the auto renew period value      | The account creation should fail and return error response - INVALID_RENEWAL_PERIOD                                                                                                                           |
| 3       | Create an account and set the auto renew period to 10 days (864000 seconds)    | A public key and 864000 as the auto renew period value  | The account creation should fail and return error response -AUTORENEW_DURATION_NOT_IN_RANGE                                                                                                                   |

### **Alias:**

- The bytes to be used as the account's alias. The bytes will be 1 of 2 options. It will be the serialization of a protobuf Key message for an ED25519/ECDSA_SECP256K1 primitive key type. If the account is ECDSA_SECP256K1 based it may also be the public address, calculated as the last 20 bytes of the keccak-256 hash of the ECDSA_SECP256K1 primitive key. Currently only primitive key bytes are supported as the key for an account with an alias. ThresholdKey, KeyList, ContractID, and delegatable_contract_id are not supported.
- A given alias can map to at most one account on the network at a time. This uniqueness will be enforced relative to aliases currently on the network at alias assignment.
- If a transaction creates an account using an alias, any further crypto transfers to that alias will simply be deposited in that account, without creating anything, and with no creation fee being charged

| Test no | Name | Input | Expected response |
| ------- | ---- | ----- | ----------------- |
| 1       |  Create an account via an alias account    |  An operator account id, an alias account id and an initial balance     |  The account creation succeeds. . It can be queried on the consensus node with AccountInfoQuery, and on mirror node using the REST API, within 10 seconds                 |

