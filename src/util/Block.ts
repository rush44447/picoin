import { Config } from "./Config";
import CryptoUtil from "./CryptoUtil";

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

  static toHash(block: Block) {
    return CryptoUtil.hash(block.index + block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce);
  }

  static difficulty(hash: string) {
    let s = parseInt(hash.substring(0,14), 16);
    return Number(s.toString().substring(0,17));
  }
}