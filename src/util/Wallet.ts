import { KeyPair } from "./KeyPair";
import KeyPairs from "../wallet/KeyPairs";
import CryptoUtil from "./CryptoUtil";
import CryptoEdDSAUtil from "./CryptoEdDSAUtil";

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

    const lastPair = this.keyPairs[this.keyPairs.length-1];
    const seed = lastPair == null ? this.secret : CryptoEdDSAUtil.generateSecret(lastPair.secretKey);
    const keyPairRow = CryptoEdDSAUtil.generateKeyPairFromSecret(seed);
    const keyPairVar = {
      index: this.keyPairs.length+1,
      secretKey: CryptoEdDSAUtil.toHex(keyPairRow.getSecret()),
      publicKey: CryptoEdDSAUtil.toHex(keyPairRow.getPublic()),
    }
    this.keyPairs.push(keyPairVar);
    return keyPairVar.publicKey;
  }

  generateSecret(){
    this.secret = CryptoEdDSAUtil.generateSecret(this.passwordHash);
    return this.secret;
  }

  getAddressByIndex(index: number) {
    const keyPair = this.keyPairs.find((keypairdata) => keypairdata.index == index);
    return keyPair ? keyPair.publicKey : null;
  }

  getSecretKeyByPublicKey(publicKey: string) {
    const keyPair = this.keyPairs.find((keypairdata) => keypairdata.publicKey == publicKey);
    return keyPair ? keyPair.secretKey : null;
  }

  getAddresses() {
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
      if(key == 'keyPairs' && wallet[key]) {
        data[key] = KeyPairs.fromJsonArray(wallet[key]);
      } else {
        data[key]=wallet[key];
      }
    });
    return data;
  }
}