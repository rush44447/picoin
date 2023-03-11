import { KeyPair } from "../util/KeyPair";

export default class KeyPairs extends Array {
  static fromJsonArray(data) {
    const keyPairs = new KeyPairs();
    if(Array.isArray(data)){
      data.map((obj)=>{
        keyPairs.push(KeyPair.organizeJsonArray(obj));
      })
    }
    return keyPairs;
  }
}