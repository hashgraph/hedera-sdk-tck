import { PublicKey } from "@hashgraph/sdk";
import { proto } from "@hashgraph/proto";

import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";

export const getEncodedKeyHexFromKeyListConsensus = async (
  accountId,
  keyName
) => {
  // Retrieve account info
  const accountInfo = await consensusInfoClient.getAccountInfo(accountId);
  
  // Access the dynamic key (e.g., wipeKey, freezeKey, etc.)
  const key = accountInfo[keyName];

  // Encode the key into Protobuf and convert to hex string
  const encodedKeyList = proto.Key.encode(key._toProtobufKey()).finish();
  const keyHex = Buffer.from(encodedKeyList).toString("hex");
  
  return keyHex;
};


export  const getPublicKeyFromMirrorNode = async (accountId, keyName) => {
  // Define a mapping for key type functions
  const keyTypeConvertFunctions = {
    ED25519: PublicKey.fromStringED25519,
    ECDSA_SECP256K1: PublicKey.fromStringECDSA,
  };

  // Retrieve account data from Mirror Node
  const accountData = await mirrorNodeClient.getAccountData(accountId);

  

  // Access the dynamic key (e.g., fee_schedule_key, admin_key, etc.)
  const keyMirrorNode = accountData[keyName];

  // Use the appropriate key type function to convert the key
  const publicKeyMirrorNode = keyTypeConvertFunctions[keyMirrorNode._type](
    keyMirrorNode.key
  );

  return publicKeyMirrorNode;
};