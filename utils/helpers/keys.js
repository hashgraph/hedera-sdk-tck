import { proto } from "@hashgraph/proto";

import mirrorNodeClient from "../../mirrorNodeClient.js";
import consensusInfoClient from "../../consensusInfoClient.js";
import { keyTypeConvertFunctions } from "./constants/key-type.js";

/**
 * Retrieves the encoded hexadecimal representation of a specified dynamic key
 * from an account's information in the consensus layer.
 *
 * @async
 * @param {string} accountId - The ID of the account from which to retrieve the key.
 * @param {string} keyName - The name of the dynamic key to retrieve (e.g., wipeKey, freezeKey).
 * @returns {Promise<string>} - A promise that resolves to the hexadecimal representation of the encoded key.
 */
export const getEncodedKeyHexFromKeyListConsensus = async (
  accountId,
  keyName,
) => {
  // Retrieve account info
  const accountInfo = await consensusInfoClient.getAccountInfo(accountId);

  const protoKey = accountInfo[keyName]._toProtobufKey();
  let encodedKeyList;

  if (protoKey.thresholdKey) {
    encodedKeyList = proto.ThresholdKey.encode(protoKey.thresholdKey).finish();
  } else {
    encodedKeyList = proto.KeyList.encode(protoKey.keyList).finish();
  }

  const keyHex = Buffer.from(encodedKeyList).toString("hex");

  return keyHex;
};

/**
 * Retrieves the public key from the Mirror Node for a specified account and key name.
 *
 * @async
 * @param {string} accountId - The ID of the account from which to retrieve the public key.
 * @param {string} keyName - The name of the key to retrieve from the Mirror Node.
 * @returns {Promise<PublicKey>} - A promise that resolves to the public key object retrieved from the Mirror Node.
 */
export const getPublicKeyFromMirrorNode = async (accountId, keyName) => {
  // Retrieve account data from Mirror Node
  const accountData = await mirrorNodeClient.getAccountData(accountId);

  // Access the dynamic key (e.g., fee_schedule_key, admin_key, etc.)
  const keyMirrorNode = accountData[keyName];

  // Use the appropriate key type function to convert the key
  const publicKeyMirrorNode = keyTypeConvertFunctions[keyMirrorNode._type](
    keyMirrorNode.key,
  );

  return publicKeyMirrorNode;
};
