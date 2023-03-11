import { Block } from "../util/Block";

export default class Blocks extends Array {
  static fromJsonArray(data) {
    const blocks = new Blocks();
    if(Array.isArray(data)){
      data.map((obj)=>{
        blocks.push(Block.organizeJsonArray(obj));
      })
    }
    return blocks;
  }
}