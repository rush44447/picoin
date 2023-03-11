import { Config } from "./Config";

export class Block {
  index: number;
  nonce: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  transactions: any;

  static organizeJsonArray(block) {
    const data = new Block();
    const keys = Object.keys(block);
    keys.forEach((key)=> {
      data[key]=block[key];
    })
    return data;
  }

  static get genesis() {
    return Block.organizeJsonArray(Config.genesisBlock)
  }
}