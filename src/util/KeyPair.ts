export class KeyPair {
  index: number;
  secretKey: string;
  publicKey: string;

  static organizeJsonArray(keyPair) {
    if(keyPair.hasOwnProperty('index') &&
      keyPair.hasOwnProperty('publicKey') &&
      keyPair.hasOwnProperty('secretKey'))
    return keyPair;
    return null;
  }
}