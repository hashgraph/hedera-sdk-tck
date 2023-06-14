# JSON-RPC API documentation - Create account

# Description:

API documentation for the JSON-RPC server - creating an account.

For account creation, the createAccount method handles setting all the required and optional parameters for calling the SDKs AccountCreateTransaction()

AccountCreateTransaction() parameters:

```javascipt
* @param publicKey required
* @param initialBalance optional
* @param receiverSignatureRequired optional
* @param maxAutomaticTokenAssociations optional
* @param stakedAccountId optional
* @param stakedNodeId optional
* @param declineStakingReward optional
* @param accountMemo optional
* @param autoRenewPeriod optional
* @param privateKey optional (used for signing)
```

# Methods:

---

### Setting up/break down environment

### [setup (testnet)](#setup1)

Parameters

| Name                      | Type   | Description                         |
| ------------------------- | ------ | ----------------------------------- |
| params                    | object |                                     |
| params.OperatorAccountID  | string | Account Id of the operator          |
| params.OperatorPrivateKey | string | Private key of the operator account |

### [setup (local node)](#setup2)

Parameters

| Name                      | Type   | Description                         |
| ------------------------- | ------ | ----------------------------------- |
| params                    | object |                                     |
| params.OperatorAccountID  | string | Account Id of the operator          |
| params.OperatorPrivateKey | string | Private key of the operator account |
| params.nodeIP             | string | IP of the local node                |
| params.nodeAccountID      | string | Account ID for the local node       |
| params.mirrorNetworkIP    | string | IP for the mirror network           |

### [reset](#reset)

Parameters

| Name   | Type   | Description                        |
| ------ | ------ | ---------------------------------- |
| method | string | “reset” method to reset sdk client |

**Result/error parameters**

Result

| Name           | Type   | Description                              |
| -------------- | ------ | ---------------------------------------- |
| result         | object |                                          |
| result.message | string | Details on the testnet mirror node setup |
| result.status  | string | Status of the network setup/teardown     |

Errors

| Code | Message                     | Description                     |
| ---- | --------------------------- | ------------------------------- |
| 0    | failed to parse entity id   | Provided operator ID is invalid |
| 0    | invalid private key length: | No value given to operator ID   |

---

### Account creation

Calls for create account. The JSON-RPC server returns a string representation of a transaction receipt back to the test driver

- Method: createAccount
  **Parameters:**
  - [publicKey](#publickey)
  - [initialBalance](#initialkalance)
  - [maxAutomaticTokenAssociations](#maxautomatictokenassociations)
  - [stakedAccountId](#stakedaccountid)
  - [stakedNodeId](#stakednodeid)
  - [declineStakingReward](#declinestakingreward)
  - [accountMemo](#accountmemo)
  - [autoRenewPeriod](#autorenewperiod)

params

| Name                                 | Type    | Description                                                                     |          |
| ------------------------------------ | ------- | ------------------------------------------------------------------------------- | -------- |
| params                               | object  |                                                                                 |          |
| params.publicKey                     | string  | The accounts public key                                                         | Required |
| params.initialBalance                | number  | Initial balance for the new account                                             | Optional |
| params.receiverSignatureRequired     | boolean | True/false if the receiver signature is required                                | Optional |
| params.maxAutomaticTokenAssociations | number  | Max token associations of the account                                           | Optional |
| params.stakedAccountID               | string  | Id of the account the new account is staking to. Can stake to a node OR account | Optional |
| params.stakedNodeId                  | string  | Id of the node the new account is staking to. Can stake to a node OR account    | Optional |
| params.declineStakingReward          | boolean | True/false if declining to receive staking rewards                              | Optional |
| params.accountMemo                   | string  | Account memo for the new account                                                | Optional |

result

| Name             | Type   | Description                    |
| ---------------- | ------ | ------------------------------ |
| result           | object |                                |
| result.accountId | string | The ID of the new account      |
| result.status    | string | Status of the account creation |

error

| Name               | Type   | Description                 |
| ------------------ | ------ | --------------------------- |
| error.data         | object |                             |
| error.data.status  | string | The hedera error code value |
| error.data.message | string | Full error message          |

---

### setup1

- This method sets up the environment for connecting to Testnet

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 567,
  "method": "setup",
  "params": {
    "operatorAccountId": "0.0.47762334",
    "operatorPrivateKey": "302e020100300506032b65700422042091f37373fe8b38bd4495e489ae7cb50c28909970231b906b6322a984e582f6af"
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 567,
  "result": {
    "message": "Successfully setup testnet client.",
    "status": "SUCCESS"
  }
}
```

---

### setup2

- This method sets up the environment for connecting to the Local Node

**Example:**

Request

```json
{
    "jsonrpc": "2.0",
    "id": 763543,
    "method": "setup",
    "params": {
        "operatorAccountId": "0.0.47762334",
        "operatorPrivateKey": "302e020100300506032b65700422042091f37373fe8b38bd4495e489ae7cb50c28909970231b906b6322a984e582f6af"
				"nodeIp": "127.0.0.1:50211",
        "nodeAccountId": "3",
        "mirrorNetworkIp": "127.0.0.1:5600"
    }
}
```

Response

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

### reset

- This method resets the SDK client

**Examples**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "method": "reset"
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "result": true
}
```

---

### publicKey

- This parameter sets the public key for account creation

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213"
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "result": {
    "accountId": "0.0.48601829",
    "status": "SUCCESS"
  }
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "message": "invalid public key length: 42 bytes"
    }
  }
}
```

---

### initialBalance

- This parameter sets the initial balance of the account when creating an account

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "initialBalance": 5000
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "result": {
    "accountId": "0.0.48601829",
    "status": "SUCCESS"
  }
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "error": {
    "code": -32001,
    "message": "Hedera Error",
    "data": {
      "status": "INVALID_INITIAL_BALANCE",
      "message": "transaction 0.0.47762334@1665620301.783615877 failed precheck with status INVALID_INITIAL_BALANCE"
    }
  }
}
```

---

### receiverSignatureRequired

- This parameter sets the receiverSignatureRequired property when creating an account. If true, a private key must be supplied to sign the transaction

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "privateKey": "302e020100300506032b65700422042091f37373fe8b38bd4495e489ae7cb50c28909970231b906b6322a984e582f6af",
    "initialBalance": 5000,
    "receiverSignatureRequired": true
  }
}
```

Response

```yaml
{
  'jsonrpc': '2.0',
  'id': 648,
  'result': { 'accountId': '0.0.48601829', 'status': 'SUCCESS' },
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "error": {
    "code": -32001,
    "message": "Hedera Error",
    "data": {
      "status": "INVALID_SIGNATURE",
      "message": "receipt for transaction 0.0.47762334@1665621371.487172994 contained error status INVALID_SIGNATURE"
    }
  }
}
```

---

### maxAutomaticTokenAssociations

- This parameter sets the maxAutomaticTokenAssociations property when creating an account.

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "maxAutomaticTokenAssociations": 2
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "result": {
    "accountId": "0.0.48601829",
    "status": "SUCCESS"
  }
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "error": {
    "code": -32001,
    "message": "Hedera Error",
    "data": {
      "status": "REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT",
      "message": "transaction 0.0.47762334@1665622075.473792774 failed precheck with status REQUESTED_NUM_AUTOMATIC_ASSOCIATIONS_EXCEEDS_ASSOCIATION_LIMIT"
    }
  }
}
```

---

### stakedAccountId

- This parameter sets the stakedAccountId property when creating an account. Note an account can stake to another account ID OR a node ID

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "stakedAccountId": "0.0.47762334"
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "result": {
    "accountId": "0.0.48601829",
    "status": "SUCCESS"
  }
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "error": {
    "code": -32001,
    "message": "Hedera Error",
    "data": {
      "status": "INVALID_STAKING_ID",
      "message": "transaction 0.0.47762334@1665623150.206800943 failed precheck with status INVALID_STAKING_ID"
    }
  }
}
```

---

### stakedNodeId

- This parameter sets the stakedNodeId property when creating an account. Note an account can stake to another account ID OR a node ID

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "stakedNodeId": "0.0.47762334"
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "result": {
    "accountId": "0.0.48601829",
    "status": "SUCCESS"
  }
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "error": {
    "code": -32001,
    "message": "Hedera Error",
    "data": {
      "status": "INVALID_STAKING_ID",
      "message": "transaction 0.0.47762334@1665623150.206800943 failed precheck with status INVALID_STAKING_ID"
    }
  }
}
```

---

### declineStakingReward

- This parameter sets the declineStakingReward property when creating an account.

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 649,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "declineStakingReward": true
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "result": {
    "accountId": "0.0.48601829",
    "status": "SUCCESS"
  }
}
```

Error

```yaml
None
```

---

### accountMemo

This parameter sets the accountMemo property when creating an account.

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 649,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "accountMemo": "Hello I am an account memo"
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 648,
  "result": {
    "accountId": "0.0.48601829",
    "status": "SUCCESS"
  }
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 649,
  "error": {
    "code": -32001,
    "message": "Hedera Error",
    "data": {
      "status": "MEMO_TOO_LONG",
      "message": "transaction 0.0.47762334@1665624763.603280522 failed precheck with status MEMO_TOO_LONG"
    }
  }
}
```

---

### autoRenewPeriod

This parameter sets the autoRenewPeriod property when creating an account.

**Example:**

Request

```json
{
  "jsonrpc": "2.0",
  "id": 649,
  "method": "createAccount",
  "params": {
    "publicKey": "302a300506032b6570032100eb42aa1eabdb60bfd1d6ac3c9f226f0ff7d5a53335f67a851e446e015290f213",
    "autoRenewPeriod": "2592000"
  }
}
```

Response

```json
{
  "jsonrpc": "2.0",
  "id": 649,
  "result": {
    "accountId": "0.0.48628115",
    "status": "SUCCESS"
  }
}
```

Error

```json
{
  "jsonrpc": "2.0",
  "id": 649,
  "error": {
    "code": -32001,
    "message": "Hedera Error",
    "data": {
      "status": "AUTORENEW_DURATION_NOT_IN_RANGE",
      "message": "transaction 0.0.47762334@1665882197.620188556 failed precheck with status AUTORENEW_DURATION_NOT_IN_RANGE"
    }
  }
}
```
