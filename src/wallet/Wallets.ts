import { Block } from "../util/Block";
import { Wallet } from "../util/Wallet";

export default class Wallets extends Array {
  static fromJsonArray(data) {
    const wallets = new Wallets();
    if(Array.isArray(data)){
      data.map((obj)=>{
        wallets.push(Wallet.organizeJsonArray(obj));
      })
    }
    return wallets;
  }
}