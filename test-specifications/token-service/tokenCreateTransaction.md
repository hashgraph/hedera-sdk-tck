# TokenCreateTransaction - Test specification

## Description:
This test specification for TokenCreateTransaction is to be one of many for testing the functionality of the Hedera SDKs. The SDK under test will use the language specific JSON-RPC server return responses back to the test driver.

## Design:
Each test within the test specification is linked to one of the properties within TokenCreateTransaction. Each property is tested with a mix of boundaries. The inputs for each test are a range of valid, minimum, maximum, negative and invalid values for the method. The expected response of a passed test can be a correct error response code or seen as the result of node queries. A successful transaction (the transaction reached consensus and was applied to state) can be determined by getting a `TransactionReceipt` or `TransactionRecord`, or can be determined by using queries such as `TokenInfoQuery` or `TokenBalanceQuery` and investigating for the required changes (creations, updates, etc.). The mirror node can also be used to determine if a transaction was successful via its rest API. Error codes are obtained from the response code proto files.

**Transaction properties:**

https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/define-a-token

**CryptoCreate protobufs:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/token_create.proto

**Response codes:**

https://github.com/hashgraph/hedera-protobufs/blob/main/services/response_code.proto

**Mirror Node APIs:**

https://docs.hedera.com/hedera/sdks-and-apis/rest-api

## JSON-RPC API Endpoint Documentation

### Method Name

`createToken`

### Input Parameters

| Parameter Name          | Type                                             | Required/Optional | Description/Notes                                                                                                                                                                                                                                 |
|-------------------------|--------------------------------------------------|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name                    | string                                           | optional          | The name of the new token.                                                                                                                                                                                                                        |
| symbol                  | string                                           | optional          | The symbol of the new token.                                                                                                                                                                                                                      |
| decimals                | uint32                                           | optional          | The number of decimal places by which the new token will be divisible.                                                                                                                                                                            |
| initialSupply           | uint64                                           | optional          | The number of tokens to put into circulation upon creation.                                                                                                                                                                                       |
| treasuryAccountId       | string                                           | optional          | The ID of the account which will act as the new token's treasury and will receive the specified initial supply of the new token.                                                                                                                  |
| adminKey                | string                                           | optional          | The key which can perform update/delete operations on the new token. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes.                                  |
| kycKey                  | string                                           | optional          | The key which can grant/revoke KYC on an account for transactions of the new token. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes.                   |
| freezeKey               | string                                           | optional          | The key which can freeze/unfreeze an account for transactions of the new token. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes.                       |
| wipeKey                 | string                                           | optional          | The key which can wipe the balance of the new token from an account. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes.                                  |
| supplyKey               | string                                           | optional          | The key which can change the supply of the new token. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes.                                                 |
| freezeDefault           | bool                                             | optional          | Should accounts initially be frozen with respect to the new token?                                                                                                                                                                                |
| expirationTime          | int64                                            | optional          | The time at which the new token should expire. Epoch time in seconds                                                                                                                                                                              |
| autoRenewAccountId      | string                                           | optional          | The ID of the account that should be charged to renew the new token's expiration.                                                                                                                                                                 |
| autoRenewPeriod         | int64                                            | optional          | The interval at which the auto renew account will be charged to extend the new token's expiration. Units of seconds                                                                                                                               |
| memo                    | string                                           | optional          | The memo associated with the token.                                                                                                                                                                                                               |
| tokenType               | string                                           | optional          | The type of the new token. MUST be one of `ft` (fungible token) or `nft` (non-fungible token)                                                                                                                                                     |
| supplyType              | string                                           | optional          | The supply type of the new token. MUST be one of `infinite` or `finite`                                                                                                                                                                           |
| maxSupply               | int64                                            | optional          | The maximum amount of the new token that can be in circulation (for fungible types) or minted (for NFTs).                                                                                                                                         |
| feeScheduleKey          | string                                           | optional          | The key which can change the new token's fee schedule. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes.                                                |
| customFees              | list<[json object](../customFee.md)>             | optional          | The fees to be assessed during a transfer of the new token.                                                                                                                                                                                       |
| pauseKey                | string                                           | optional          | The key which can pause/unpause the new token. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes.                                                        |
| metadata                | string                                           | optional          | The metadata of the new token. Hex-encoded bytes of the metadata                                                                                                                                                                                  |
| metadataKey             | string                                           | optional          | The key which can change the metadata of the new token and/or individual NFTs of the new token class. DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| commonTransactionParams | [json object](../commonTransactionParameters.md) | optional          |                                                                                                                                                                                                                                                   |

### Output Parameters

| Parameter Name | Type   | Description/Notes                                                                   |
|----------------|--------|-------------------------------------------------------------------------------------|
| tokenId        | string | The ID of the created token.                                                        |
| status         | string | The status of the submitted `TokenCreateTransaction` (from a `TransactionReceipt`). |

## Property Tests

### **Name:**

- The name for the new token.

| Test no | Name                                                        | Input                                                                                                                                                                      | Expected response                                                                                                                                               | Implemented (Y/N) |
|---------|-------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a name that is a valid length          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>                                                                                              | The token creation succeeds and the token's name equals "testname".                                                                                             | N                 |
| 2       | Creates a token with a name that is the minimum length      | name="t", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>                                                                                                     | The token creation succeeds and the token's name equals "t".                                                                                                    | N                 |
| 3       | Creates a token with a name that is empty                   | name="", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>                                                                                                      | The token creation fails with a MISSING_TOKEN_NAME response code from the network.                                                                              | N                 |
| 4       | Creates a token with a name that is the maximum length      | name="This is a really long name but it is still valid because it is 100 characters exactly on the money!!", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>  | The token creation succeeds and the token's name equals "This is a really long name but it is still valid because it is 100 characters exactly on the money!!". | N                 |
| 5       | Creates a token with a name that exceeds the maximum length | name="This is a long name that is not valid because it exceeds 100 characters and it should fail the test!!", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID> | The token creation fails with a TOKEN_NAME_TOO_LONG response code from the network.                                                                             | N                 |
| 6       | Creates a token with no name                                | symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>                                                                                                               | The token creation fails with a MISSING_TOKEN_NAME response code from the network.                                                                              | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "result": {
    "tokenId": "0.0.1646",
    "status": "SUCCESS"
  }
}
```

### **Symbol:**

- The symbol for the new token.

| Test no | Name                                                          | Input                                                                                                                                                                    | Expected response                                                                                                                                                 | Implemented (Y/N) |
|---------|---------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a symbol that is the minimum length      | name="testname", symbol="t", treasuryAccountId=<OPERATOR_ACCOUNT_ID>                                                                                                     | The token creation succeeds and the token's symbol equals "t".                                                                                                    | N                 |
| 2       | Creates a token with a symbol that is empty                   | name="testname", symbol="", treasuryAccountId=<OPERATOR_ACCOUNT_ID>                                                                                                      | The token creation fails with a MISSING_TOKEN_SYMBOL response code from the network.                                                                              | N                 |
| 3       | Creates a token with a symbol that is the maximum length      | name="testname", symbol="This is a really long symbol but it is still valid because it is 100 characters exactly on the money", treasuryAccountId=<OPERATOR_ACCOUNT_ID>  | The token creation succeeds and the token's symbol equals "This is a really long symbol but it is still valid because it is 100 characters exactly on the money". | N                 |
| 4       | Creates a token with a symbol that exceeds the maximum length | name="testname", symbol="This is a long symbol that is not valid because it exceeds 100 characters and it should fail the test", treasuryAccountId=<OPERATOR_ACCOUNT_ID> | The token creation fails with a TOKEN_SYMBOL_TOO_LONG response code from the network.                                                                             | N                 |
| 5       | Creates a token with no symbol                                | name="testname", treasuryAccountId=<OPERATOR_ACCOUNT_ID>                                                                                                                 | The token creation fails with a MISSING_TOKEN_SYMBOL response code from the network.                                                                              | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 641,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 641,
  "result": {
    "tokenId": "0.0.836",
    "status": "SUCCESS"
  }
}
```

### **Decimals:**

- The number of decimal places by which a token is divisible.

| Test no | Name                                                                           | Input                                                                                                      | Expected response                                                                       | Implemented (Y/N) |
|---------|--------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a fungible token with a valid amount of decimals                       | name="testname", symbol="testsymbol", decimals=3, treasuryAccountId=<OPERATOR_ACCOUNT_ID>                  | The token creation succeeds and the token has 3 decimals.                               | N                 |
| 2       | Creates a fungible token with the minimum amount of decimals                   | name="testname", symbol="testsymbol", decimals=0, treasuryAccountId=<OPERATOR_ACCOUNT_ID>                  | The token creation succeeds and the token has 0 decimals.                               | N                 |
| 3       | Creates a fungible token with a decimal amount below the minimum amount        | name="testname", symbol="testsymbol", decimals=-1, treasuryAccountId=<OPERATOR_ACCOUNT_ID>                 | The token creation fails with an INVALID_TOKEN_DECIMALS response code from the network. | N                 |
| 4       | Creates a fungible token with the maximum amount of decimals                   | name="testname", symbol="testsymbol", decimals=2147483647, treasuryAccountId=<OPERATOR_ACCOUNT_ID>         | The token creation succeeds and the token has 2,147,483,647 decimals.                   | N                 |
| 5       | Creates a fungible token with a decimal amount that exceeds the maximum amount | name="testname", symbol="testsymbol", decimals=2147483648, treasuryAccountId=<OPERATOR_ACCOUNT_ID>         | The token creation fails with an INVALID_TOKEN_DECIMALS response code from the network. | N                 |
| 6       | Creates an NFT with a decimal amount of zero                                   | name="testname", symbol="testsymbol", decimals=0, treasuryAccountId=<OPERATOR_ACCOUNT_ID>, tokenType="nft" | The token creation fails with a TOKEN_HAS_NO_SUPPLY_KEY response code from the network. | N                 |
| 7       | Creates an NFT with a nonzero decimal amount                                   | name="testname", symbol="testsymbol", decimals=3, treasuryAccountId=<OPERATOR_ACCOUNT_ID>, tokenType="nft" | The token creation fails with an INVALID_TOKEN_DECIMALS response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 8895,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "decimals": 3,
    "treasuryAccountId": "0.0.2"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 8895,
  "result": {
    "tokenId": "0.0.68721",
    "status": "SUCCESS"
  }
}
```

### **Initial Supply:**

- The number of tokens to be created.

| Test no | Name                                                                            | Input                                                                                                            | Expected response                                                                                  | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a fungible token with a valid initial supply                            | name="testname", symbol="testsymbol", initialSupply=1000000, treasuryAccountId=<OPERATOR_ACCOUNT_ID>             | The token creation succeeds and 1,000,000 tokens are held by the treasury account.                 | N                 |
| 2       | Creates a fungible token with a valid initial supply and decimals               | name="testname", symbol="testsymbol", decimals=2, initialSupply=1000000, treasuryAccountId=<OPERATOR_ACCOUNT_ID> | The token creation succeeds and 10,000 tokens are held by the treasury account.                    | N                 |
| 3       | Creates a fungible token with a valid initial supply and more decimals          | name="testname", symbol="testsymbol", decimals=6, initialSupply=1000000, treasuryAccountId=<OPERATOR_ACCOUNT_ID> | The token creation succeeds and 1 token is held by the treasury account.                           | N                 |
| 4       | Creates a fungible token with the minimum initial supply                        | name="testname", symbol="testsymbol", initialSupply=0, treasuryAccountId=<OPERATOR_ACCOUNT_ID>                   | The token creation succeeds and 0 tokens are held by the treasury account.                         | N                 |
| 5       | Creates a fungible token with an initial supply below the minimum amount        | name="testname", symbol="testsymbol", initialSupply=-1, treasuryAccountId=<OPERATOR_ACCOUNT_ID>                  | The token creation fails with an INVALID_TOKEN_INITIAL_SUPPLY response code from the network.      | N                 |
| 6       | Creates a fungible token with the maximum initial supply                        | name="testname", symbol="testsymbol", initialSupply=9223372036854775807, treasuryAccountId=<OPERATOR_ACCOUNT_ID> | The token creation succeeds and 9,223,372,036,854,775,807 tokens are held by the treasury account. | N                 |
| 7       | Creates a fungible token with an initial supply that exceeds the maximum amount | name="testname", symbol="testsymbol", initialSupply=9223372036854775808, treasuryAccountId=<OPERATOR_ACCOUNT_ID> | The token creation fails with an INVALID_TOKEN_INITIAL_SUPPLY response code from the network.      | N                 |
| 8       | Creates an NFT with an initial supply of zero                                   | name="testname", symbol="testsymbol", initialSupply=0, treasuryAccountId=<OPERATOR_ACCOUNT_ID>, tokenType="nft"  | The token creation fails with a TOKEN_HAS_NO_SUPPLY_KEY response code from the network.            | N                 |
| 9       | Creates an NFT with a nonzero initial supply                                    | name="testname", symbol="testsymbol", initialSupply=3, treasuryAccountId=<OPERATOR_ACCOUNT_ID>, tokenType="nft"  | The token creation fails with an INVALID_TOKEN_INITIAL_SUPPLY response code from the network.      | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 6432,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "initialSupply": 30000000,
    "treasuryAccountId": "0.0.2"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 6432,
  "result": {
    "tokenId": "0.0.1127",
    "status": "SUCCESS"
  }
}
```

### **Treasury Account:**

- The account that will hold the token "treasury" and receive all minted tokens.

| Test no | Name                                                                                   | Input                                                                                                                                         | Expected response                                                                                   | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a treasury account                                                | name="testname", symbol="testsymbol", treasuryAccountId=<VALID_ACCOUNT_ID>, commonTransactionParams.signers=[<ACCOUNT_PRIVATE_KEY>]           | The token creation succeeds and the token has <VALID_ACCOUNT_ID> as its treasury.                   | N                 |
| 2       | Creates a token with a treasury account without signing with the account's private key | name="testname", symbol="testsymbol", treasuryAccountId=<VALID_ACCOUNT_ID>                                                                    | The token creation fails with an INVALID_SIGNATURE response code from the network.                  | N                 |
| 3       | Creates a token with a treasury account that doesn't exist                             | name="testname", symbol="testsymbol", treasuryAccountId="123.456.789"                                                                         | The token creation fails with an INVALID_ACCOUNT_ID response code from the network.                 | N                 |
| 4       | Creates a token with a treasury account that is deleted                                | name="testname", symbol="testsymbol", treasuryAccountId=<DELETED_ACCOUNT_ID>, commonTransactionParams.signers=[<DELETED_ACCOUNT_PRIVATE_KEY>] | The token creation fails with an INVALID_TREASURY_ACCOUNT_FOR_TOKEN response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 8895,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 8895,
  "result": {
    "tokenId": "0.0.6415",
    "status": "SUCCESS"
  }
}
```

### **Admin Key:**

- The key which can perform administrative operations (update/delete) on the token.

| Test no | Name                                                                                                             | Input                                                                                                                                                                                                   | Expected response                                                                                  | Implemented (Y/N) |
|---------|------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its admin key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its admin key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its admin key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its admin key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its admin key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its admin key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its admin key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its admin key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its admin key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its admin key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its admin key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its admin key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its admin key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its admin key.               | N                 |
| 8       | Creates a token with a valid key as its admin key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                 | N                 |
| 9       | Creates a token with an invalid key as its admin key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, adminKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                               | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "adminKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **KYC Key:**

- The key which can grant or revoke KYC operations on an account for the token's transactions.

| Test no | Name                                                                                                           | Input                                                                                                                     | Expected response                                                                                | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its KYC key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ED25519_PUBLIC_KEY>          | The token creation succeeds and the token has the new ED25519 public key as its KYC key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its KYC key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>  | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its KYC key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its KYC key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ED25519_PRIVATE_KEY>         | The token creation succeeds and the token has the new ED25519 private key as its KYC key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its KYC key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY> | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its KYC key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_KEYLIST>                     | The token creation succeeds and the token has the new KeyList as its KYC key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its KYC key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_NESTED_KEYLIST>              | The token creation succeeds and the token has the new nested KeyList as its KYC key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_THRESHOLD_KEY>               | The token creation succeeds and the token has the new ThresholdKey as its KYC key.               | N                 |
| 8       | Creates a token with an invalid key as its KYC key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, kycKey=<INVALID_KEY>                       | The token creation fails with an SDK internal error.                                             | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "kycKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Freeze Key:**

- The key which can freeze or unfreeze an account for the token's transactions.

| Test no | Name                                                                                                              | Input                                                                                                                                                                                                    | Expected response                                                                                   | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its freeze key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its freeze key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its freeze key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its freeze key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its freeze key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its freeze key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its freeze key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its freeze key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its freeze key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its freeze key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its freeze key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its freeze key.               | N                 |
| 8       | Creates a token with a valid key as its freeze key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                  | N                 |
| 9       | Creates a token with an invalid key as its freeze key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                                | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "freezeKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Wipe Key:**

- The key which can wipe the token's balance from an account.

| Test no | Name                                                                                                            | Input                                                                                                                                                                                                  | Expected response                                                                                 | Implemented (Y/N) |
|---------|-----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its wipe key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its wipe key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its wipe key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its wipe key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its wipe key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its wipe key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its wipe key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its wipe key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its wipe key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its wipe key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its wipe key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its wipe key.               | N                 |
| 8       | Creates a token with a valid key as its wipe key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                | N                 |
| 9       | Creates a token with an invalid key as its wipe key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, wipeKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                              | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "wipeKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Supply Key:**

- The key which can change the supply of a token.

| Test no | Name                                                                                                              | Input                                                                                                                                                                                                    | Expected response                                                                                   | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its supply key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its supply key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its supply key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its supply key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its supply key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its supply key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its supply key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its supply key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its supply key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its supply key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its supply key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its supply key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its supply key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its supply key.               | N                 |
| 8       | Creates a token with a valid key as its supply key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                  | N                 |
| 9       | Creates a token with an invalid key as its supply key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                                | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "supplyKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Freeze Default:**

- Should accounts be initially frozen relative to this token?

| Test no | Name                                            | Input                                                                                              | Expected response                                                         | Implemented (Y/N) |
|---------|-------------------------------------------------|----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a frozen default status    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeDefault=true  | The token creation succeeds and the token has a frozen default status.    | N                 |
| 2       | Creates a token with an unfrozen default status | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, freezeDefault=false | The token creation succeeds and the token has an unfrozen default status. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "freezeDefault": true
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Expiration Time:**

- The time at which the token will expire and attempt to extend its expiration date.

| Test no | Name                                                                            | Input                                                                                                                  | Expected response                                                                                                         | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid expiration time                                    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, expirationTime=<CURRENT_TIME> + 5184000 | The token creation succeeds and the token has an expiration time 5,184,000 seconds (60 days) from the current epoch time. | N                 |
| 2       | Creates a token with an expiration time of one less than the current time       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, expirationTime=<CURRENT_TIME> - 1       | The token creation fails with an INVALID_EXPIRATION_TIME response code from the network.                                  | N                 |
| 3       | Creates a token with an expiration time 8,000,002 seconds from the current time | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, expirationTime=-8000002                 | The token creation fails with an INVALID_EXPIRATION_TIME response code from the network.                                  | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "expirationTime": 5184000
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Auto Renew Account:**

- The ID of the account to pay for the auto-renewal of the token.

| Test no | Name                                                          | Input                                                                                                                  | Expected response                                                                          | Implemented (Y/N) |
|---------|---------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with an auto renew account                    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewAccountId=<VALID_ACCOUNT_ID>   | The token creation succeeds and the token has a valid auto-renew account.                  | N                 |
| 2       | Creates a token with an auto renew account that doesn't exist | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewAccountId="123.456.789"        | The token creation fails with an INVALID_AUTORENEW_ACCOUNT response code from the network. | N                 |
| 3       | Creates a token with an empty auto renew account              | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewAccountId=""                   | The token creation fails with an SDK internal error.                                       | N                 |
| 4       | Creates a token with an auto renew account that is deleted    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewAccountId=<DELETED_ACCOUNT_ID> | The token creation fails with an INVALID_AUTORENEW_ACCOUNT response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "autoRenewAccountId": "0.0.2"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Auto Renew Period:**

- The auto renew account of this token is charged to extend its expiration date every ‘this many’ seconds. If it doesn't have enough balance, it extends as long as possible. If the account is empty when it expires, the token is deleted.

| Test no | Name                                                                                                                | Input                                                                                                  | Expected response                                                                                | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with an auto renew period set to 60 days (5,184,000 seconds)                                        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewPeriod=5184000 | The token creation succeeds and the token's auto renew period equals 5,184,000 seconds.          | N                 |
| 2       | Creates a token with an auto renew period set to -1 seconds                                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewPeriod=-1      | The token creation fails with an INVALID_RENEWAL_PERIOD response code from the network.          | N                 |
| 3       | Creates a token with an auto renew period set to the minimum period of 30 days (2,592,000 seconds)                  | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewPeriod=2592000 | The token creation succeeds and the token's auto renew period equals 2,592,000 seconds.          | N                 |
| 4       | Creates a token with an auto renew period set to the minimum period of 30 days minus one second (2,591,999 seconds) | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewPeriod=2591999 | The token creation fails with an AUTORENEW_DURATION_NOT_IN_RANGE response code from the network. | N                 |
| 5       | Creates a token with an auto renew period set to the maximum period of 8,000,001 seconds                            | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewPeriod=8000001 | The token creation succeeds and the token's auto renew period equals 8,000,001 seconds.          | N                 |
| 6       | Creates a token with an auto renew period set to the maximum period plus one second (8,000,002 seconds)             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, autoRenewPeriod=8000002 | The token creation fails with an AUTORENEW_DURATION_NOT_IN_RANGE response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "autoRenewPeriod": 5184000
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Memo:**

- The memo associated with the token (UTF-8 encoding max 100 bytes).

| Test no | Name                                                        | Input                                                                                                                                                                                       | Expected response                                                                                                                                               | Implemented (Y/N) |
|---------|-------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a memo that is a valid length          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, memo="testmemo"                                                                                              | The token creation succeeds and the token's memo equals "testmemo".                                                                                             | N                 |
| 2       | Creates a token with a memo that is the minimum length      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, memo=""                                                                                                      | The token creation succeeds and the token's memo is empty.                                                                                                      | N                 |
| 3       | Creates a token with a memo that is the maximum length      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, memo="This is a really long memo but it is still valid because it is 100 characters exactly on the money!!"  | The token creation succeeds and the token's memo equals "This is a really long memo but it is still valid because it is 100 characters exactly on the money!!". | N                 |
| 4       | Creates a token with a memo that exceeds the maximum length | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, memo="This is a long memo that is not valid because it exceeds 100 characters and it should fail the test!!" | The token creation fails with an MEMO_TOO_LONG response code from the network.                                                                                  | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "memo": "testmemo"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Token Type:**

- The type of token to be created.

| Test no | Name                                | Input                                                                                                                 | Expected response                                                                        | Implemented (Y/N) |
|---------|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a fungible token            | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, tokenType="ft"                         | The token creation succeeds and the token is a fungible token.                           | N                 |
| 2       | Creates an NFT                      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, tokenType="nft" | The token creation succeeds and the token is an NFT.                                     | N                 |
| 3       | Creates an NFT without a supply key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, tokenType="nft"                        | The token creation fails with an TOKEN_HAS_NO_SUPPLY_KEY response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "tokenType": "ft"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Supply Type:**

- Can there be a finite or infinite amount of tokens created?

| Test no | Name                                   | Input                                                                                                | Expected response                                                 | Implemented (Y/N) |
|---------|----------------------------------------|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a finite supply   | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite"   | The token creation succeeds and the token has a finite supply.    | N                 |
| 2       | Creates a token with a infinite supply | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="infinite" | The token creation succeeds and the token has an infinite supply. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "supplyType": "finite"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Max Supply:**

- For fungible tokens, the maximum amount of tokens that can be in circulation. For NFTs, the maximum number that can be minted.

| Test no | Name                                                                       | Input                                                                                                                                                         | Expected response                                                                                  | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a fungible token with a valid max supply                           | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=1000000                                         | The token creation succeeds and has a max supply of 1,000,000.                                     | N                 |
| 2       | Creates a fungible token with the minimum max supply                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=1                                               | The token creation succeeds and has a max supply of 1.                                             | N                 |
| 3       | Creates a fungible token with a max supply below the minimum amount        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=0                                               | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 4       | Creates a fungible token with the maximum max supply                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=9223372036854775807                             | The token creation succeeds and 9,223,372,036,854,775,807 tokens are held by the treasury account. | N                 |
| 5       | Creates a fungible token with a max supply that exceeds the maximum amount | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=9223372036854775808                             | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 6       | Creates a fungible token with a max supply and an infinite supply type     | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, maxSupply=1000000                                                              | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 7       | Creates an NFT with an max supply of zero                                  | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, supplyType="finite", tokenType="nft", maxSupply=0       | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 8       | Creates an NFT with a nonzero max supply                                   | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, supplyType="finite", tokenType="nft", maxSupply=1000000 | The token creation succeeds and has a max supply of 1,000,000.                                     | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "maxSupply": 1000000
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Max Supply:**

- For fungible tokens, the maximum amount of tokens that can be in circulation. For NFTs, the maximum number that can be minted.

| Test no | Name                                                                       | Input                                                                                                                                                         | Expected response                                                                                  | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a fungible token with a valid max supply                           | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=1000000                                         | The token creation succeeds and has a max supply of 1,000,000.                                     | N                 |
| 2       | Creates a fungible token with the minimum max supply                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=1                                               | The token creation succeeds and has a max supply of 1.                                             | N                 |
| 3       | Creates a fungible token with a max supply below the minimum amount        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=0                                               | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 4       | Creates a fungible token with the maximum max supply                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=9223372036854775807                             | The token creation succeeds and 9,223,372,036,854,775,807 tokens are held by the treasury account. | N                 |
| 5       | Creates a fungible token with a max supply that exceeds the maximum amount | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyType="finite", maxSupply=9223372036854775808                             | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 6       | Creates a fungible token with a max supply and an infinite supply type     | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, maxSupply=1000000                                                              | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 7       | Creates an NFT with an max supply of zero                                  | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, supplyType="finite", tokenType="nft", maxSupply=0       | The token creation fails with an INVALID_TOKEN_MAX_SUPPLY response code from the network.          | N                 |
| 8       | Creates an NFT with a nonzero max supply                                   | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, supplyType="finite", tokenType="nft", maxSupply=1000000 | The token creation succeeds and has a max supply of 1,000,000.                                     | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "maxSupply": 1000000
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Fee Schedule Key:**

- The key which can change the token's custom fee schedule.

| Test no | Name                                                                                                                    | Input                                                                                                                                                                                                         | Expected response                                                                                         | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its fee schedule key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its fee schedule key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its fee schedule key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its fee schedule key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its fee schedule key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its fee schedule key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its fee schedule key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its fee schedule key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its fee schedule key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its fee schedule key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its fee schedule key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its fee schedule key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its fee schedule key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its fee schedule key.               | N                 |
| 8       | Creates a token with a valid key as its fee schedule key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                        | N                 |
| 9       | Creates a token with an invalid key as its fee schedule key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, feeScheduleKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                                      | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "feeScheduleKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Custom Fees:**

- The fees which should be assessed when this token is transferred.

| Test no | Name                                                                                         | Input                                                                                                                                                                                                                                                                                                                                                                                                                                    | Expected response                                                                                                       | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a fixed fee                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=10}]                                                                                                                                                                                                                                                 | The token creation succeeds and the token has the custom fixed fee.                                                     | N                 |
| 2       | Creates a token with a fractional fee                                                        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=10, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                                 | The token creation succeeds and the token has the custom fractional fee.                                                | N                 |
| 3       | Creates a token with a royalty fee                                                           | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, tokenType="nft", customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fee.numerator=1, fee.denominator=10, fee.fallbackFee.feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, fee.fallbackFee.feeCollectorsExempt=false, fee.fallbackFee.amount=10}]                                                     | The token creation succeeds and the token has the custom royalty fee.                                                   | N                 |
| 4       | Creates a token with a fee that has a fee collector account that doesn't exist               | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId="123.456.789", feeCollectorsExempt=false, fixedFee.amount=10}]                                                                                                                                                                                                                                                         | The token creation fails with an INVALID_CUSTOM_FEE_COLLECTOR response code from the network.                           | N                 |
| 5       | Creates a token with a fee with an empty fee collector account                               | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId="", feeCollectorsExempt=false, fixedFee.amount=10}]                                                                                                                                                                                                                                                                    | The token creation fails with an SDK internal error.                                                                    | N                 |
| 6       | Creates a token with a fee that has a deleted fee collector account                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<DELETED_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=10}], commonTransactionParams.signers=[<DELETED_ACCOUNT_ID_PRIVATE_KEY>]                                                                                                                                                                              | The token creation succeeds and the token has the custom fixed fee.                                                     | N                 |
| 7       | Creates a token with a fixed fee with the minimum amount                                     | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=1}]                                                                                                                                                                                                                                                  | The token creation succeeds and the token has the custom fixed fee.                                                     | N                 |
| 8       | Creates a token with a fixed fee with the amount below the minimum amount                    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=0}]                                                                                                                                                                                                                                                  | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 9       | Creates a token with a fixed fee with the maximum amount                                     | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=9223372036854775807}]                                                                                                                                                                                                                                | The token creation succeeds and the token has the custom fixed fee.                                                     | N                 |
| 10      | Creates a token with a fixed fee with the amount above the maximum amount                    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=9223372036854775808}]                                                                                                                                                                                                                                | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 11      | Creates a token with a fixed fee that is assessed with the created token                     | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=10, fixedFee.denominatingTokenId="0.0.0"}]                                                                                                                                                                                                           | The token creation succeeds and the token has the custom fixed fee.                                                     | N                 |
| 12      | Creates a token with a fixed fee that is assessed with a token that doesn't exist            | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=10, fixedFee.denominatingTokenId="123.456.789"}]                                                                                                                                                                                                     | The token creation fails with a INVALID_TOKEN_ID_IN_CUSTOM_FEES response code from the network.                         | N                 |
| 13      | Creates a token with a fixed fee that is assessed with an empty token                        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=10, fixedFee.denominatingTokenId=""}]                                                                                                                                                                                                                | The token creation fails with an SDK internal error.                                                                    | N                 |
| 14      | Creates a token with a fixed fee that is assessed with a deleted token                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=10, fixedFee.denominatingTokenId=<DELETED_TOKEN_ID>}]                                                                                                                                                                                                | The token creation fails with a INVALID_TOKEN_ID_IN_CUSTOM_FEES response code from the network.                         | N                 |
| 15      | Creates a token with a fractional fee with the minimum fractional amount                     | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=9223372036854775807, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                | The token creation succeeds and the token has the custom fractional fee.                                                | N                 |
| 16      | Creates a token with a fractional fee with the amount below the minimum fractional amount    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=0, fractionalFee.denominator=9223372036854775807, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 17      | Creates a token with a fractional fee with the maximum fractional amount                     | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=9223372036854775807, fractionalFee.denominator=1, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                | The token creation succeeds and the token has the custom fractional fee.                                                | N                 |
| 18      | Creates a token with a fractional fee with the amount above the maximum fractional amount    | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=9223372036854775808, fractionalFee.denominator=1, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 19      | Creates a token with a fractional fee with a 0 denominator                                   | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=0, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                                  | The token creation fails with a FRACTION_DIVIDES_BY_ZERO response code from the network.                                | N                 |
| 20      | Creates a token with a fractional fee with the minimum minimum amount                        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=10, fractionalFee.minimumAmount=0, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                                 | The token creation succeeds and the token has the custom fractional fee.                                                | N                 |
| 21      | Creates a token with a fractional fee with the minimum amount below the minimum amount       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=10, fractionalFee.minimumAmount=-1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="inclusive"}]                                                                                                | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 22      | Creates a token with a fractional fee with the maximum maximum amount                        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=10, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=9223372036854775807, fractionalFee.assessmentMethod="inclusive"}]                                                                                | The token creation succeeds and the token has the custom fractional fee.                                                | N                 |
| 23      | Creates a token with a fractional fee with the maximum amount above the maximum amount       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=10, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=9223372036854775808, fractionalFee.assessmentMethod="inclusive"}]                                                                                | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 24      | Creates a token with a fractional fee with the minimum amount higher than the maximum amount | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=10, fractionalFee.minimumAmount=10, fractionalFee.maximumAmount=1, fractionalFee.assessmentMethod="inclusive"}]                                                                                                 | The token creation fails with a FRACTIONAL_FEE_MAX_AMOUNT_LESS_THAN_MIN_AMOUNT response code from the network.          | N                 |
| 25      | Creates a token with a fractional fee that is assessed to the receiver                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fractionalFee.numerator=1, fractionalFee.denominator=10, fractionalFee.minimumAmount=1, fractionalFee.maximumAmount=10, fractionalFee.assessmentMethod="exclusive"}]                                                                                                 | The token creation succeeds and the token has the custom fractional fee.                                                | N                 |
| 26      | Creates a token with a royalty fee with the minimum fractional amount                        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, tokenType="nft", customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, royaltyFee.numerator=1, royaltyFee.denominator=9223372036854775807, royaltyFee.fallbackFee.feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, royaltyFee.fallbackFee.feeCollectorsExempt=false, royaltyFee.fallbackFee.amount=10}] | The token creation succeeds and the token has the custom royalty fee.                                                   | N                 |
| 27      | Creates a token with a royalty fee with the amount below the minimum fractional amount       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, tokenType="nft", customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, royaltyFee.numerator=0, royaltyFee.denominator=9223372036854775807, royaltyFee.fallbackFee.feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, royaltyFee.fallbackFee.feeCollectorsExempt=false, royaltyFee.fallbackFee.amount=10}] | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 28      | Creates a token with a royalty fee with the maximum fractional amount                        | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, tokenType="nft", customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, royaltyFee.numerator=9223372036854775807, royaltyFee.denominator=1, royaltyFee.fallbackFee.feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, royaltyFee.fallbackFee.feeCollectorsExempt=false, royaltyFee.fallbackFee.amount=10}] | The token creation succeeds and the token has the custom royalty fee.                                                   | N                 |
| 29      | Creates a token with a royalty fee with the amount above the maximum fractional amount       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, tokenType="nft", customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, royaltyFee.numerator=9223372036854775808, royaltyFee.denominator=1, royaltyFee.fallbackFee.feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, royaltyFee.fallbackFee.feeCollectorsExempt=false, royaltyFee.fallbackFee.amount=10}] | The token creation fails with a CUSTOM_FEE_MUST_BE_POSITIVE response code from the network.                             | N                 |
| 30      | Creates a token with a royalty fee with a 0 denominator                                      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>, tokenType="nft", customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, royaltyFee.numerator=1, royaltyFee.denominator=0, royaltyFee.fallbackFee.feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, royaltyFee.fallbackFee.feeCollectorsExempt=false, royaltyFee.fallbackFee.amount=10}]                   | The token creation fails with a FRACTION_DIVIDES_BY_ZERO response code from the network.                                | N                 |
| 31      | Creates a fungible token with a royalty fee                                                  | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, royaltyFee.numerator=1, royaltyFee.denominator=10, royaltyFee.fallbackFee.feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, royaltyFee.fallbackFee.feeCollectorsExempt=false, royaltyFee.fallbackFee.amount=10}]                                                          | The token creation fails with a CUSTOM_ROYALTY_FEE_ONLY_ALLOWED_FOR_NON_FUNGIBLE_UNIQUE response code from the network. | N                 |
| 32      | Creates a token with more than the maximum amount of fees allowed                            | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, customFees=[{feeCollectorAccountId=<OPERATOR_ACCOUNT_ID>, feeCollectorsExempt=false, fixedFee.amount=10}... (x11)]                                                                                                                                                                                                                                        | The token creation fails with a CUSTOM_FEES_LIST_TOO_LONG response code from the network.                               | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "customFees": [
      {
        "feeCollectorAccountId": "0.0.2",
        "feeCollectorsExempt": false,
        "fee": {
          "amount": 10,
          "denominatingTokenId": "0.0.10"
        }
      }
    ]
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Pause Key:**

- The key which can pause and unpause a token.

| Test no | Name                                                                                                             | Input                                                                                                                                                                                                   | Expected response                                                                                  | Implemented (Y/N) |
|---------|------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its pause key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its pause key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its pause key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its pause key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its pause key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its pause key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its pause key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its pause key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its pause key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its pause key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its pause key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its pause key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its pause key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its pause key.               | N                 |
| 8       | Creates a token with a valid key as its pause key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                 | N                 |
| 9       | Creates a token with an invalid key as its pause key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, pauseKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                               | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "pauseKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Metadata:**

- The metadata of the created token.

| Test no | Name                                | Input                                                                                          | Expected response                                                      | Implemented (Y/N) |
|---------|-------------------------------------|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with metadata       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadata="1234" | The token creation succeeds and the token definition has the metadata. | N                 |
| 2       | Creates a token with empty metadata | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadata=""     | The token creation succeeds and the token definition has no metadata.  | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "metadata": "1234"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```

### **Metadata Key:**

- The key which can update the metadata of a token.

| Test no | Name                                                                                                                | Input                                                                                                                                                                                                      | Expected response                                                                                     | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its metadata key                                                 | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its metadata key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its metadata key                                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its metadata key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its metadata key                                                | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its metadata key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its metadata key                                         | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its metadata key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its metadata key      | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its metadata key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its metadata key                          | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its metadata key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its metadata key | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its metadata key.               | N                 |
| 8       | Creates a token with a valid key as its metadata key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                    | N                 |
| 9       | Creates a token with an invalid key as its metadata key                                                             | name="testname", symbol="testsymbol", treasuryAccountId=<OPERATOR_ACCOUNT_ID>, metadataKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                                  | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccountId": "0.0.2",
    "metadataKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "tokenId": "0.0.541",
    "status": "SUCCESS"
  }
}
```
