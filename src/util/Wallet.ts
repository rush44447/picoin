import CryptoUtil from "./CryptoUtil";
import {KeyPair} from "./KeyPair";
import CryptoEdDSAUtil from "./CryptoEdDSAUtil";
import {last} from "rxjs";

export class Wallet {
  id: string;
  passwordHash: string;
  secret: string;
  keyPairs : KeyPair[];

  constructor() {
    this.id=null;
    this.passwordHash=null;
    this.secret=null;
    this.keyPairs=[];
  }

  generateAddress() {
    if(this.secret == null){
      this.generateSecret();
    }
    const lastPair = this.keyPairs[this.keyPairs.length - 1];
    const seed = lastPair == null ? this.secret : CryptoEdDSAUtil.generateSecret(lastPair.secretKey) || null;

    const keyPairRow = CryptoEdDSAUtil.generateKeyPairFromSecret(seed);
    const keyPairVar = {
      index: this.keyPairs.length +1,
      secretKey: CryptoEdDSAUtil.toHex(keyPairRow.getSecret()),
      publicKey: CryptoEdDSAUtil.toHex(keyPairRow.getPublic())
    }
    this.keyPairs.push(keyPairVar);
    return keyPairVar.publicKey;
  }

  generateSecret() {
    this.secret = CryptoEdDSAUtil.generateSecret(this.passwordHash);
    return this.secret;
  }


  getAddresses()  {
    return this.keyPairs.map((keypair) => keypair.publicKey);
  }

  static fromHash(hash) {
    const wallet = new Wallet()
    wallet.passwordHash = hash;
    wallet.id = CryptoUtil.randomId();
    return wallet;
  }

  static organizeJsonArray(wallet) {
    const data = new Wallet();
    const keys = Object.keys(wallet);
    keys.forEach((key)=> {
      data[key]=wallet[key];
    });
    return data;
  }

    getSecretKeyByAddress(fromAddressId) {
        const keyPair = this.keyPairs.find((keypairObj)=> keypairObj.publicKey == fromAddressId);
        return keyPair ? keyPair.secretKey : null;
    }
}