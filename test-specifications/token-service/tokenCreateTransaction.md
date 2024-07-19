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

| Parameter Name          | Type                                             | Required/Optional | Description/Notes                                                                                                                           |
|-------------------------|--------------------------------------------------|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| name                    | string                                           | optional          |                                                                                                                                             |
| symbol                  | string                                           | optional          |                                                                                                                                             |
| decimals                | uint32                                           | optional          |                                                                                                                                             |
| initialSupply           | uint64                                           | optional          |                                                                                                                                             |
| treasuryAccount         | string                                           | optional          |                                                                                                                                             |
| adminKey                | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| kycKey                  | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| freezeKey               | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| wipeKey                 | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| supplyKey               | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| freezeDefault           | bool                                             | optional          |                                                                                                                                             |
| expirationTime          | int64                                            | optional          | Epoch time in seconds                                                                                                                       |
| autoRenewAccount        | string                                           | optional          |                                                                                                                                             |
| autoRenewPeriod         | int64                                            | optional          | Units of seconds                                                                                                                            |
| memo                    | string                                           | optional          |                                                                                                                                             |
| tokenType               | string                                           | optional          | MUST be one of `ft` (fungible token) or `nft` (non-fungible token)                                                                          |
| supplyType              | string                                           | optional          | MUST be one of `infinite` or `finite`                                                                                                       |
| maxSupply               | int64                                            | optional          |                                                                                                                                             |
| feeScheduleKey          | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| customFees              | list<[json object](../customFee.md)>             | optional          |                                                                                                                                             |
| pauseKey                | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| metadata                | string                                           | optional          | Hex-encoded bytes of the metadata                                                                                                           |
| metadataKey             | string                                           | optional          | DER-encoded hex string representation for private or public keys. Keylists and threshold keys are the hex of the serialized protobuf bytes. |
| commonTransactionParams | [json object](../commonTransactionParameters.md) | optional          |                                                                                                                                             |

### Output Parameters

| Parameter Name | Type   | Description/Notes                                                                   |
|----------------|--------|-------------------------------------------------------------------------------------|
| tokenId        | string | The ID of the created token.                                                        |
| status         | string | The status of the submitted `TokenCreateTransaction` (from a `TransactionReceipt`). |

## Property Tests

### **Name:**

- The name for the new token.

| Test no | Name                                                        | Input                                                                                                                                                                    | Expected response                                                                                                                                               | Implemented (Y/N) |
|---------|-------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a name that is a valid length          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>                                                                                              | The token creation succeeds and the token's name equals "testname".                                                                                             | N                 |
| 2       | Creates a token with a name that is the minimum length      | name="t", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>                                                                                                     | The token creation succeeds and the token's name equals "t".                                                                                                    | N                 |
| 3       | Creates a token with a name that is empty                   | name="", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>                                                                                                      | The token creation fails with a MISSING_TOKEN_NAME response code from the network.                                                                              | N                 |
| 4       | Creates a token with a name that is the maximum length      | name="This is a really long name but it is still valid because it is 100 characters exactly on the money!!", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>  | The token creation succeeds and the token's name equals "This is a really long name but it is still valid because it is 100 characters exactly on the money!!". | N                 |
| 5       | Creates a token with a name that exceeds the maximum length | name="This is a long name that is not valid because it exceeds 100 characters and it should fail the test!!", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID> | The token creation fails with a TOKEN_NAME_TOO_LONG response code from the network.                                                                             | N                 |
| 6       | Creates a token with no name                                | symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>                                                                                                               | The token creation fails with a MISSING_TOKEN_NAME response code from the network.                                                                              | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2"
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

| Test no | Name                                                          | Input                                                                                                                                                                  | Expected response                                                                                                                                                 | Implemented (Y/N) |
|---------|---------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a symbol that is the minimum length      | name="testname", symbol="t", treasuryAccount=<OPERATOR_ACCOUNT_ID>                                                                                                     | The token creation succeeds and the token's symbol equals "t".                                                                                                    | N                 |
| 2       | Creates a token with a symbol that is empty                   | name="testname", symbol="", treasuryAccount=<OPERATOR_ACCOUNT_ID>                                                                                                      | The token creation fails with a MISSING_TOKEN_SYMBOL response code from the network.                                                                              | N                 |
| 3       | Creates a token with a symbol that is the maximum length      | name="testname", symbol="This is a really long symbol but it is still valid because it is 100 characters exactly on the money", treasuryAccount=<OPERATOR_ACCOUNT_ID>  | The token creation succeeds and the token's symbol equals "This is a really long symbol but it is still valid because it is 100 characters exactly on the money". | N                 |
| 4       | Creates a token with a symbol that exceeds the maximum length | name="testname", symbol="This is a long symbol that is not valid because it exceeds 100 characters and it should fail the test", treasuryAccount=<OPERATOR_ACCOUNT_ID> | The token creation fails with a TOKEN_SYMBOL_TOO_LONG response code from the network.                                                                             | N                 |
| 5       | Creates a token with no symbol                                | name="testname", treasuryAccount=<OPERATOR_ACCOUNT_ID>                                                                                                                 | The token creation fails with a MISSING_TOKEN_SYMBOL response code from the network.                                                                              | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 641,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2"
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

| Test no | Name                                                                           | Input                                                                                                    | Expected response                                                                       | Implemented (Y/N) |
|---------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a fungible token with a valid amount of decimals                       | name="testname", symbol="testsymbol", decimals=3, treasuryAccount=<OPERATOR_ACCOUNT_ID>                  | The token creation succeeds and the token has 3 decimals.                               | N                 |
| 2       | Creates a fungible token with the minimum amount of decimals                   | name="testname", symbol="testsymbol", decimals=0, treasuryAccount=<OPERATOR_ACCOUNT_ID>                  | The token creation succeeds and the token has 0 decimals.                               | N                 |
| 3       | Creates a fungible token with a decimal amount below the minimum amount        | name="testname", symbol="testsymbol", decimals=-1, treasuryAccount=<OPERATOR_ACCOUNT_ID>                 | The token creation fails with an INVALID_TOKEN_DECIMALS response code from the network. | N                 |
| 4       | Creates a fungible token with the maximum amount of decimals                   | name="testname", symbol="testsymbol", decimals=2147483647, treasuryAccount=<OPERATOR_ACCOUNT_ID>         | The token creation succeeds and the token has 2147483647 decimals.                      | N                 |
| 5       | Creates a fungible token with a decimal amount that exceeds the maximum amount | name="testname", symbol="testsymbol", decimals=2147483648, treasuryAccount=<OPERATOR_ACCOUNT_ID>         | The token creation fails with an INVALID_TOKEN_DECIMALS response code from the network. | N                 |
| 6       | Creates an NFT with a decimal amount of zero                                   | name="testname", symbol="testsymbol", decimals=0, treasuryAccount=<OPERATOR_ACCOUNT_ID>, tokenType="nft" | The token creation fails with a TOKEN_HAS_NO_SUPPLY_KEY response code from the network. | N                 |
| 7       | Creates an NFT with a nonzero decimal amount                                   | name="testname", symbol="testsymbol", decimals=3, treasuryAccount=<OPERATOR_ACCOUNT_ID>, tokenType="nft" | The token creation fails with an INVALID_TOKEN_DECIMALS response code from the network. | N                 |

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
    "treasuryAccount": "0.0.2"
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

| Test no | Name                                                                            | Input                                                                                                          | Expected response                                                                             | Implemented (Y/N) |
|---------|---------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a fungible token with a valid initial supply                            | name="testname", symbol="testsymbol", initialSupply=1000000, treasuryAccount=<OPERATOR_ACCOUNT_ID>             | The token creation succeeds and 1000000 tokens are held by the treasury account.              | N                 |
| 2       | Creates a fungible token with the minimum initial supply                        | name="testname", symbol="testsymbol", initialSupply=0, treasuryAccount=<OPERATOR_ACCOUNT_ID>                   | The token creation succeeds and 0 tokens are held by the treasury account.                    | N                 |
| 3       | Creates a fungible token with an initial supply below the minimum amount        | name="testname", symbol="testsymbol", initialSupply=-1, treasuryAccount=<OPERATOR_ACCOUNT_ID>                  | The token creation fails with an INVALID_TOKEN_INITIAL_SUPPLY response code from the network. | N                 |
| 4       | Creates a fungible token with the maximum initial supply                        | name="testname", symbol="testsymbol", initialSupply=9223372036854775807, treasuryAccount=<OPERATOR_ACCOUNT_ID> | The token creation succeeds and 9223372036854775807 tokens are held by the treasury account.  | N                 |
| 5       | Creates a fungible token with an initial supply that exceeds the maximum amount | name="testname", symbol="testsymbol", initialSupply=9223372036854775808, treasuryAccount=<OPERATOR_ACCOUNT_ID> | The token creation fails with an INVALID_TOKEN_INITIAL_SUPPLY response code from the network. | N                 |
| 6       | Creates an NFT with an initial supply of zero                                   | name="testname", symbol="testsymbol", initialSupply=0, treasuryAccount=<OPERATOR_ACCOUNT_ID>, tokenType="nft"  | The token creation fails with a TOKEN_HAS_NO_SUPPLY_KEY response code from the network.       | N                 |
| 7       | Creates an NFT with a nonzero initial supply                                    | name="testname", symbol="testsymbol", initialSupply=3, treasuryAccount=<OPERATOR_ACCOUNT_ID>, tokenType="nft"  | The token creation fails with an INVALID_TOKEN_INITIAL_SUPPLY response code from the network. | N                 |

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
    "treasuryAccount": "0.0.2"
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

- The number of tokens to be created.

| Test no | Name                                                                                   | Input                                                                                                                                       | Expected response                                                                                   | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a treasury account                                                | name="testname", symbol="testsymbol", treasuryAccount=<VALID_ACCOUNT_ID>, commonTransactionParams.signers=[<ACCOUNT_PRIVATE_KEY>]           | The token creation succeeds and the token has <VALID_ACCOUNT_ID> as its treasury.                   | N                 |
| 2       | Creates a token with a treasury account without signing with the account's private key | name="testname", symbol="testsymbol", treasuryAccount=<VALID_ACCOUNT_ID>                                                                    | The token creation fails with an INVALID_SIGNATURE response code from the network.                  | N                 |
| 3       | Creates a token with a treasury account that doesn't exist                             | name="testname", symbol="testsymbol", treasuryAccount="123.456.789"                                                                         | The token creation fails with an INVALID_ACCOUNT_ID response code from the network.                 | N                 |
| 4       | Creates a token with a treasury account that is deleted                                | name="testname", symbol="testsymbol", treasuryAccount=<DELETED_ACCOUNT_ID>, commonTransactionParams.signers=[<DELETED_ACCOUNT_PRIVATE_KEY>] | The token creation fails with an INVALID_TREASURY_ACCOUNT_FOR_TOKEN response code from the network. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 8895,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2"
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

| Test no | Name                                                                                                             | Input                                                                                                                                                                                                 | Expected response                                                                                  | Implemented (Y/N) |
|---------|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its admin key                                                 | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its admin key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its admin key                                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its admin key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its admin key                                                | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its admin key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its admin key                                         | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its admin key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its admin key      | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its admin key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its admin key                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its admin key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its admin key | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its admin key.               | N                 |
| 8       | Creates a token with a valid key as its admin key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                 | N                 |
| 9       | Creates a token with an invalid key as its admin key                                                             | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, adminKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                               | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2",
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

| Test no | Name                                                                                                           | Input                                                                                                                                                                                               | Expected response                                                                                | Implemented (Y/N) |
|---------|----------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its KYC key                                                 | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its KYC key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its KYC key                                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its KYC key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its KYC key                                                | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its KYC key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its KYC key                                         | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its KYC key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key      | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its KYC key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its KYC key                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its KYC key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its KYC key | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its KYC key.               | N                 |
| 8       | Creates a token with a valid key as its KYC key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.               | N                 |
| 9       | Creates a token with an invalid key as its KYC key                                                             | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, kycKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                             | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2",
    "kycKey": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
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

### **Freeze Key:**

- The key which can freeze or unfreeze an account for the token's transactions.

| Test no | Name                                                                                                              | Input                                                                                                                                                                                                  | Expected response                                                                                   | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its freeze key                                                 | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its freeze key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its freeze key                                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its freeze key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its freeze key                                                | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its freeze key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its freeze key                                         | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its freeze key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key      | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its freeze key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its freeze key                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its freeze key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its freeze key | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its freeze key.               | N                 |
| 8       | Creates a token with a valid key as its freeze key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                  | N                 |
| 9       | Creates a token with an invalid key as its freeze key                                                             | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                                | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2",
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

| Test no | Name                                                                                                            | Input                                                                                                                                                                                                | Expected response                                                                                 | Implemented (Y/N) |
|---------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its wipe key                                                 | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its wipe key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its wipe key                                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its wipe key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its wipe key                                                | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its wipe key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its wipe key                                         | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its wipe key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key      | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its wipe key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its wipe key                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its wipe key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its wipe key | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its wipe key.               | N                 |
| 8       | Creates a token with a valid key as its wipe key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                | N                 |
| 9       | Creates a token with an invalid key as its wipe key                                                             | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, wipeKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                              | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2",
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

| Test no | Name                                                                                                              | Input                                                                                                                                                                                                  | Expected response                                                                                   | Implemented (Y/N) |
|---------|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a valid ED25519 public key as its supply key                                                 | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ED25519_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>]         | The token creation succeeds and the token has the new ED25519 public key as its supply key.         | N                 |
| 2       | Creates a token with a valid ECDSAsecp256k1 public key as its supply key                                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ECDSA_SECP256K1_PUBLIC_KEY>, commonTransactionParams.signers=[<CORRESPONDING_VALID_ED25519_PRIVATE_KEY>] | The token creation succeeds and the token has the new ECDSAsecp256k1 public key as its supply key.  | N                 |
| 3       | Creates a token with a valid ED25519 private key as its supply key                                                | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ED25519_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ED25519_PRIVATE_KEY>]                      | The token creation succeeds and the token has the new ED25519 private key as its supply key.        | N                 |
| 4       | Creates a token with a valid ECDSAsecp256k1 private key as its supply key                                         | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_ECDSA_SECP256K1_PRIVATE_KEY>, commonTransactionParams.signers=[<VALID_ECDSA_SECP256K1_PRIVATE_KEY>]      | The token creation succeeds and the token has the new ECDSAsecp256k1 private key as its supply key. | N                 |
| 5       | Creates a token with a valid KeyList of ED25519 and ECDSAsecp256k1 private and public keys as its supply key      | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_KEYLIST>]                                            | The token creation succeeds and the token has the new KeyList as its supply key.                    | N                 |
| 6       | Creates a token with a valid KeyList of nested Keylists (three levels) as its supply key                          | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_NESTED_KEYLIST>, commonTransactionParams.signers=[<KEYS_IN_NESTED_KEYLIST>]                              | The token creation succeeds and the token has the new nested KeyList as its supply key.             | N                 |
| 7       | Creates a token with a valid ThresholdKey of ED25519 and ECDSAsecp256k1 private and public keys as its supply key | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_THRESHOLD_KEY>, commonTransactionParams.signers=[<KEYS_IN_THRESHOLD_KEY>]                                | The token creation succeeds and the token has the new ThresholdKey as its supply key.               | N                 |
| 8       | Creates a token with a valid key as its supply key but doesn't sign with it                                       | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<VALID_KEY>                                                                                                     | The token creation fails with an INVALID_SIGNATURE response code from the network.                  | N                 |
| 9       | Creates a token with an invalid key as its supply key                                                             | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, supplyKey=<INVALID_KEY>                                                                                                   | The token creation fails with an SDK internal error.                                                | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2",
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

| Test no | Name                                            | Input                                                                                            | Expected response                                                         | Implemented (Y/N) |
|---------|-------------------------------------------------|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a frozen default status    | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeDefault=true  | The token creation succeeds and the token has a frozen default status.    | N                 |
| 2       | Creates a token with an unfrozen default status | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeDefault=false | The token creation succeeds and the token has an unfrozen default status. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2",
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

- Should accounts be initially frozen relative to this token?

| Test no | Name                                            | Input                                                                                            | Expected response                                                         | Implemented (Y/N) |
|---------|-------------------------------------------------|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|-------------------|
| 1       | Creates a token with a frozen default status    | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeDefault=true  | The token creation succeeds and the token has a frozen default status.    | N                 |
| 2       | Creates a token with an unfrozen default status | name="testname", symbol="testsymbol", treasuryAccount=<OPERATOR_ACCOUNT_ID>, freezeDefault=false | The token creation succeeds and the token has an unfrozen default status. | N                 |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "createToken",
  "params": {
    "name": "testname",
    "symbol": "testsymbol",
    "treasuryAccount": "0.0.2",
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
