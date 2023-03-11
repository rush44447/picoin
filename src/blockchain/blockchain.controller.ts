import { Controller, Get, Param } from "@nestjs/common";
import { DB } from "../util/DB";
import { BlockchainService } from "./blockchain.service";
import Blocks from "./Blocks";
import { Block } from "../util/Block";

@Controller('blockchain')
export class BlockchainController {
  BlocksDB: DB;
  TransactionsDB: DB;
  blocks: Blocks

  constructor(private blockchainService: BlockchainService) {
    this.BlocksDB = this.blockchainService.initializeBlocksDB();
    this.init();
  }

  async init(){
    this.blocks = this.BlocksDB.read(Blocks);
    if(this.blocks.length == 0){
      this.blocks.push(Block.genesis);
      try {
        await this.BlocksDB.write(this.blocks);
      } catch (e) {
        console.log(e);
      }
    }
  }

  @Get()
  getAllBlocks() {
    return this.blocks;
  }

  @Get('blocks/:hash([a-zA-Z0-9]{64})')
  getBlockByHash(@Param('hash') hash: string){
    return this.blocks.find((block)=>block.hash == hash)
  }

  @Get('blocks/last')
  getLastBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  @Get('blocks/:index')
  getBlockByIndex(@Param('index') index: string){
    return this.blocks.find((block)=>block.index == Number(index));
  }
}
