export class ASN1Decoder {
  constructor(data) {
    this.data = new Uint8Array(data);
    this.pos = 0;
    this.oids = [];
    this.oidMap = {
      "1.3.132.0.10": "ecdsa",
      "1.3.101.112": "ed25519",
      "1.2.840.10045.2.1": "pubkey",
    };
  }

  readLength() {
    let length = this.data[this.pos++];
    if (length & 0x80) {
      let numBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < numBytes; i++) {
        length = (length << 8) | this.data[this.pos++];
      }
    }
    return length;
  }

  readType() {
    return this.data[this.pos++];
  }

  readInteger() {
    let length = this.readLength();
    let value = 0;
    for (let i = 0; i < length; i++) {
      value = (value << 8) | this.data[this.pos++];
    }
    return { integer: value };
  }

  readOctetString() {
    let length = this.readLength();
    let value = this.data.slice(this.pos, this.pos + length);
    this.pos += length;
    return { pkey: value };
  }

  readBitString() {
    let length = this.readLength();
    let unusedBits = this.data[this.pos++]; // First byte indicates the number of unused bits
    let value = this.data.slice(this.pos, this.pos + length - 1);
    this.pos += length - 1;
    return { unusedBits, pubkey: value };
  }

  readObjectIdentifier() {
    let length = this.readLength();
    let endPos = this.pos + length;
    let oid = [];
    let value = 0;

    // The first byte contains the first two components
    let firstByte = this.data[this.pos++];
    oid.push(Math.floor(firstByte / 40));
    oid.push(firstByte % 40);

    while (this.pos < endPos) {
      let byte = this.data[this.pos++];
      value = (value << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) {
        oid.push(value);
        value = 0;
      }
    }

    let oidStr = oid.join(".");
    this.oids.push(oidStr);
    return { oid: oidStr }; // Return OID as a string
  }

  getOids() {
    return this.oids;
  }

  getOidKeyTypes() {
    return this.oids.map((oid) => this.oidMap[oid] || "unknown");
  }

  readSequence() {
    let length = this.readLength();
    let endPos = this.pos + length;
    let items = []; // this would better be map or obj
    while (this.pos < endPos) {
      items.push(this.read());
    }
    return items;
  }

  read() {
    let type = this.readType();
    switch (type) {
      case 0x02: // INTEGER
        return this.readInteger();
      case 0x03: // BIT STRING FOR PUBKEY
        return this.readBitString();
      case 0x04: // OCTET STRING FOR PKEY
        return this.readOctetString();
      case 0x06: // OBJECT IDENTIFIER FOR CURVE TYPE
        return this.readObjectIdentifier();
      case 0x30: // SEQUENCE
        return this.readSequence();
      case 0xa0: // NODE TAG COULD BE TREATED AS SEQUENCE
        return this.readSequence();
      case 0xa1: // NODE TAG COULD BE TREATED AS SEQUENCE
        return this.readSequence();
      default:
        throw new Error("Unsupported type: " + type);
    }
  }

  // New function to extract the raw key
  getRawKey() {
    // Start parsing the data
    const sequence = this.read();

    // Find the public/private key part in the parsed sequence
    for (let item of sequence) {
      if (item.pubkey) {
        // Return public key as hex string
        return Buffer.from(item.pubkey).toString("hex");
      }
      if (item.pkey) {
        // Return private key as hex string
        return Buffer.from(item.pkey).toString("hex");
      }
    }

    throw new Error("No key found in the provided data.");
  }
}

export const getRawKeyFromHex = (hex) => {
  const data1 = Uint8Array.from(Buffer.from(hex, "hex"));
  const decoder = new ASN1Decoder(data1);

  return decoder.getRawKey();
};
