# Utility JSON RPC Methods

## Description
The JSON RPC methods mentioned in this file describe additional methods that should be implemented by a TCK server that provide a utility value of some sort that is not specific to one Hedera request type. These methods can involve, but are not limited to, setting up or tearing down a test environment or using the SDK to generate a key pair to be used by the TCK driver.

## Methods

### `setup`

#### Description

Method used to establish communication and initialize a TCK server with fee-payer information, as well as optional network information depending on the network setup being used to test. If the TCK server only receives `operatorAccountId` and `operatorPrivateKey` parameters, it will assume that a testnet connection should be established. Other network parameters imply a custom/local network setup.

#### Input Parameters

| Parameter Name     | Type   | Required/Optional | Description/Notes                                                                 |
|--------------------|--------|-------------------|-----------------------------------------------------------------------------------|
| operatorAccountId  | string | required          | The ID of the account to pay for all requests                                     |
| operatorPrivateKey | string | required          | The private key of the fee-payer account in DER-encoded hex string representation |
| nodeIp             | string | optional          | Required for a custom network. The IP of the local consensus node                 |
| nodeAccountId      | string | optional          | Required for a custom network. The account ID for the local node                  |
| mirrorNetworkIp    | string | optional          | Required for a custom network. The IP for the local mirror node                   |

#### Output Parameters

| Parameter Name | Type   | Description/Notes                                       |
|----------------|--------|---------------------------------------------------------|
| message        | string | Informational message about the execution of the method |
| status         | string | The status/result of the execution                      |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 763543,
  "method": "setup",
  "params": {
    "operatorAccountId": "0.0.47762334",
    "operatorPrivateKey": "302e020100300506032b65700422042091f37373fe8b38bd4495e489ae7cb50c28909970231b906b6322a984e582f6af",
    "nodeIp": "127.0.0.1:50211",
    "nodeAccountId": "0.0.3",
    "mirrorNetworkIp": "127.0.0.1:5600"
  }
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 763543,
  "result": {
    "message": "Successfully setup custom client.",
    "status": "SUCCESS"
  }
}
```

---

### `reset`

#### Description

Method used to close the TCK network connections. Network connections can be reestablished after with another `setup` call.

#### Output Parameters

| Parameter Name | Type   | Description/Notes                                       |
|----------------|--------|---------------------------------------------------------|
| message        | string | Informational message about the execution of the method |
| status         | string | The status/result of the execution                      |

#### JSON Request Example

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "method": "reset"
}
```

#### JSON Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "result": {
    "message": "Successfully reset client.",
    "status": "SUCCESS"
  }
}
```

---

### `generateKey`

#### Description

Method used to generate a Hedera Key.

#### Input Parameters

| Parameter Name | Type   | Required/Optional | Description/Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|----------------|--------|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| type           | string | optional          | The type of Key to generate. If provided, it MUST be one of `ed25519PrivateKey`, `ed25519PublicKey`, `ecdsaSecp256k1PrivateKey`, `ecdsaSecp256k1PublicKey`, `keyList`, `thresholdKey`, `privateKey`, `publicKey`, or `evmAddress`. If not provided, the returned key will be of type `ed25519PrivateKey`, `ed25519PublicKey`, `ecdsaSecp256k1PrivateKey`, or `ecdsaSecp256k1PublicKey`. `privateKey` and `publicKey` types should be used when any private or public key type is required (respectively) but the specific type (ED25519 or ECDSAsecp256k1) doesn't matter.                                                |
| fromKey        | string | optional          | For `ed25519PublicKey` and `ecdsaSecp256k1PublicKey` types, the DER-encoded hex string private key from which to generate the public key. No value means a random `ed25519PublicKey` or `ecdsaSecp256k1PublicKey` will be generated, respectively. For the `evmAddress` type, the DER-encoded hex string of an `ecdsaSecp256k1PrivateKey` or `ecdsaSecp256k1PublicKey` from which to generate the EVM address. An `ecdsaSecp256k1PrivateKey` will first generate its respective `ecdsaSecp256k1PublicKey`, and then generate the EVM address from that public key. No value means a random EVM address will be generated. |
| threshold      | int    | optional          | Required for `thresholdKey` types. The number of keys that must sign for a threshold key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| keys           | list   | optional          | Required for `keyList` and `thresholdKey` types. Specify the types of keys to be generated and put in the `keyList` or `thresholdKey`. All keys should contain the same parameters as this `generateKey` method (see examples below), if required.                                                                                                                                                                                                                                                                                                                                                                        |

#### Output Parameters

| Parameter Name | Type   | Description/Notes                                                                                                                                                                                                                               |
|----------------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| key            | string | The DER-encoded hex string of the generated ECDSA or ED25519 private or public key (compressed if ECDSAsecp256k1 public key) or EVM address. If the type was `keyList` or `thresholdKey`, the hex string of the respective serialized protobuf. |

#### JSON Request/Response Examples

*Generates a random ED25519 or ECDSAsecp256k1 private or public key*
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "generateKey"
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "key": "302D300706052B8104000A0322000345B82F32CA13D777FC9474AD8785045A4EC8C55B15B339CE8DFE00B9AC62ED0A"
  }
}
```

*Generates an ED25519 private key*
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "generateKey",
  "params": {
    "type": "ed25519PrivateKey"
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "key": "302E020100300506032B65700422042002986CE0E075C595C8F092D4144F24925C38A4C4ADEE25E3AA0ABED5C6F309BF"
  }
}
```

*Generates an ED25519 public key*
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "generateKey",
  "params": {
    "type": "ed25519PublicKey"
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "key": "302A300506032B657003210025FCF76794560FAB2E0E795E14AB12E88C853F09BDFA7DBF7FAC7A2F6B31E403"
  }
}
```

*Generates the ECDSAsecp256k1 public key that is paired with the input ECDSAsecp256k1 private key*
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "generateKey",
  "params": {
    "type": "ecdsaSecp256k1PublicKey",
    "fromKey": "302D300706052B8104000A0322000339A36013301597DAEF41FBE593A02CC513D0B55527EC2DF1050E2E8FF49C85C2"
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "key": "3A210339A36013301597DAEF41FBE593A02CC513D0B55527EC2DF1050E2E8FF49C85C2"
  }
}
```

*Generates a threshold key that requires two keys to sign, and contains a random key, an ED25519 private key, and an ECDSAsecp256k1 public key that is paired with the input ECDSAsecp256k1 private key*
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "generateKey",
  "params": {
    "type": "thresholdKey",
    "threshold": 2,
    "keys": [
      {},
      {
        "type": "ed25519PrivateKey"
      },
      {
        "type": "ecdsaSecp256k1PublicKey",
        "privateKey": "3030020100300706052B8104000A04220420E8f32E723DECF4051AEFAC8E2C93C9C5B214313817CDB01A1494B917C8436B35"
      }
    ]
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "key": "2A710802126D0A2212209181CA10AA3166E56755D5F5A7D0A80DABB17A5699B1185F6E85B0F7F450669E0A2212205C7F51463FF9444951E878EEB7161EE7250691684DE0DFE048B68BDF1602D05F0A233A210339A36013301597DAEF41FBE593A02CC513D0B55527EC2DF1050E2E8FF49C85C2"
  }
}
```

*Generate a key list that contains two key lists. The first key list contains an ED25519 private key, a random key, and an ECDSAsecp256k1 public key that is paired with the input ECDSAsecp256k1 private key. The second key list contains an ECDSAsecp256k1 private key, a threshold key, and a random key. The threshold key requires two keys to sign, and contains two random keys and an ED25519 public key that is paired with the input ED25519 private key.*
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "generateKey",
  "params": {
    "type": "keyList",
    "keys": [
      {
        "type": "keyList",
        "keys": [
          {
            "type": "ed25519PrivateKey"
          },
          {},
          {
            "type": "ecdsaSecp256k1PublicKey",
            "privateKey": "3030020100300706052b8104000A04220420E8f32E723DECF4051AEFAC8E2C93C9C5B214313817CDB01A1494B917C8436B35"
          }
        ]
      },
      {
        "type": "keyList",
        "keys": [
          {
            "type": "ecdsaSecp256k1PrivateKey"
          },
          {
            "type": "thresholdKey",
            "threshold": 2,
            "keys": [
              {},
              {},
              {
                "type": "ed25519PublicKey",
                "privateKey": "302E020100300506032B657004220420C036915D924E5B517FAE86CE34D8C76005CB5099798A37A137831FF5E3DC0622"
              }
            ]
          },
          {}
        ]
      }
    ]
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "key": "328D020A6F326D0A22122056E73F6802877166FD611D421F8AAC8D24527E0A657AFFF28DC7167CAB838B690A221220202D875F498B407BBBF5B5358A1F73D326419B4BA5AF7A3A8C2FA03F39C9628B0A233A210339A36013301597DAEF41FBE593A02CC513D0B55527EC2DF1050E2E8FF49C85C20A99013296010A233A2103936FE869DB7187AC18E19E002B5EAE47EA6A02F51E9F02E190D1EF8F0B5DB2A50A6F326D0A233A210220C3866F3C42DFB0C530351A35274FE2BD9531B89A770D6336638D88C18150950A22122077F49D8D6F82DA4BC0AC9BD55B36571022E85812A25AEAF80B7AF4502F1CC3E70A22122008530EA4B75F639032EDA3C18F41A296CF631D1828697E4F052297553139F347"
  }
}
```

*Generate an EVM address from a specific ECDSA secp256k1 private key*
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "generateKey",
  "params": {
    "type": "evmAddress",
    "privateKey": "3030020100300706052B8104000A042204203F41CE2C0255C90738A50150818931F8F886D6C7078DDE289C089C1FB83F256F"
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "key": "F43ABA261849F4848B8A8BA4386EC49FEB61BC18"
  }
}
```