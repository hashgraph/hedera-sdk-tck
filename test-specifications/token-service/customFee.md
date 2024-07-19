# Custom Fee

Custom fees can be added to tokens that will be charged users automatically when being transferred based on a variety of parameters. These fees can be specified when a token is created (`TokenCreateTransaction`) or added/updated at a later time (`TokenFeeScheduleUpdateTransaction`).

## Custom Fee Object Definition

| Parameter Name      | Type         | Required/Optional | Description/Notes                                                                                                                                                                                                                                                                          |
|---------------------|--------------|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| feeCollectorAccount | string       | required          | The ID of the account to which all fees will be sent when assessed.                                                                                                                                                                                                                        |
| feeCollectorsExempt | bool         | required          | Should the token's treasury account and fee collector account be exempt from being charged fees when transferring the token?                                                                                                                                                               |
| fee                 | json object  | required          | The parameters of the fee to assess. It MUST be one of the structures described in [Fixed Fee Object Definition](#fixed-fee-object-definition), [Fractional Fee Object Definition](#fractional-fee-object-definition), or [Royalty Fee Object Definition](#royalty-fee-object-definition). |

### Fixed Fee Object Definition

| Parameter Name      | Type   | Required/Optional | Description/Notes                                                                                                                                                                                   |
|---------------------|--------|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| amount              | int64  | required          | The amount to be assessed as a fee.                                                                                                                                                                 |
| denominatingTokenId | string | optional          | The ID of the token to use to assess the fee. The value "0.0.0" SHALL be used to specify the token being created if used in a `TokenCreateTransaction`. Hbar SHALL be used if no value is provided. |

### Fractional Fee Object Definition

| Parameter Name   | Type   | Required/Optional | Description/Notes                                                                                                                                                                                                                                                                                                                     |
|------------------|--------|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| numerator        | int64  | required          | The numerator of the fraction of the amount to be assessed as a fee.                                                                                                                                                                                                                                                                  |
| denominator      | int64  | required          | The denominator of the fraction of the amount to be assessed as a fee.                                                                                                                                                                                                                                                                |
| minimumAmount    | int64  | required          | The minimum amount to assess as a fee.                                                                                                                                                                                                                                                                                                |
| maximumAmount    | int64  | required          | The maximum amount to assess as a fee. 0 implies no maximum.                                                                                                                                                                                                                                                                          |
| assessmentMethod | string | required          | How should the fee be assessed? It MUST be one of `inclusive` or `exclusive`. `inclusive` means the fee is included in the amount specified by `numerator` and `denominator`, while `exclusive` means the sender will be charged an additional amount of tokens in addition to the amount specified by `numerator` and `denominator`. |

### Royalty Fee Object Definition

| Parameter Name | Type        | Required/Optional | Description/Notes                                                                                          |
|----------------|-------------|-------------------|------------------------------------------------------------------------------------------------------------|
| numerator      | int64       | required          | The numerator of the fraction of the amount to be assessed as a fee.                                       |
| denominator    | int64       | required          | The denominator of the fraction of the amount to be assessed as a fee.                                     |
| fallbackFee    | json object | optional          | The [fixed fee](#fixed-fee-object-definition) to assess to the receiver if no fungible value is exchanged. |

## Example Usage

If the `createAccount` method were to contain this object and name it `"commonTransactionParams"`, its usage would look like:

```json
{
  "jsonrpc": "2.0",
  "id": 99232,
  "method": "createAccount",
  "params": {
    "key": "302a300506032b6570032100e9a0f9c81b3a2bb81a4af5fe05657aa849a3b9b0705da1fb52f331f42cf4b496",
    "receiverSignatureRequired": true,
    "commonTransactionParams": {
      "signers": [
        "302e020100300506032b65700422042031f8eb3e77a04ebe599c51570976053009e619414f26bdd39676a5d3b2782a1d"
      ]
    }
  }
}
```
