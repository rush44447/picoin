import {Body, Controller, Get, Param, Post, Put} from "@nestjs/common";
import { DB } from "../util/DB";
import { BlockchainService } from "../services/blockchain.service";
import Blocks from "./Blocks";
import { Block } from "../util/Block";
import Transactions from "./Transactions";
import {NodeController} from "../node/node.controller";
import {HttpService} from "@nestjs/axios";
import {BlockchainAssertionError} from "./BlockchainAssertionError";

@Controller('blockchain')
export class BlockchainController {
  BlocksDB: DB;
  TransactionsDB: DB;
  blocks: Blocks
  transactions: Transactions;

  constructor(private blockchainService: BlockchainService) {
    this.BlocksDB = this.blockchainService.initializeBlocksDB();
    this.TransactionsDB = this.blockchainService.initializeTransactionsDB();
    this.init();
  }

  async init(){
    this.blocks = this.BlocksDB.read(Blocks);
    this.transactions = this.TransactionsDB.read(Blocks);
    if(this.blocks.length == 0){
      this.blocks.push(Block.genesis);
      try {
        await this.BlocksDB.write(this.blocks);
      } catch (e) {
        console.log(e);
      }
    }
    this.blockchainService.blocks = this.blocks;
    this.blockchainService.transactions = this.transactions;
    this.blocks.map((block)=> this.removeTransactionsFromBlocksDB(block));
  }

  @Get()
  getAllBlocks() {
    return this.blocks;
  }

  @Get('blocks/:hash([a-zA-Z0-9]{64})')
  getBlockByHash(@Param('hash') hash: string){
    return this.blocks.find((block)=>block.hash == hash)
  }

  @Get('blocks/latest')
  getLastBlock() {
    return this.blocks.length > 0 ? this.blocks[this.blocks.length - 1] : [];
  }

  @Get('blocks/:index')
  getBlockByIndex(@Param('index') index: string){
    return this.blocks.find((block)=>block.index == Number(index));
  }

  @Put('blocks/latest')
  updateLatestBlock(@Body() body: any){
    if(body.timestamp2)body.timestamp = body.timestamp2;
    const block = Block.organizeJsonArray(body);
    const result = new NodeController(this.blockchainService, new HttpService()).checkReceivedBlock(block);
    if(!result) console.error("Blockchain is Updated")
    return block;
  }

  @Get('transactions')
  getAllTransactions() {
    return this.transactions;
  }

  @Post('transactions')
  getTransactionById(@Body() body: any){
    return this.transactions.find((data)=> data.id == body.id);
  }

  @Get('transactions/:id([a-zA-Z0-9]{64})')
  getTransactionFromBlocks(@Param('id') transactionId){
    return this.blockchainService.getTransactionFromBlocks(transactionId);
  }

  removeTransactionsFromBlocksDB(block: Block){
    const interimtransaction = this.transactions.map((data)=>
    block['transactions'].find((transact)=>transact.id == data.id)).filter((item)=> item);

    this.transactions = this.transactions.filter((transactions)=>
    !interimtransaction.find((interimdata)=> interimdata.id == transactions.id));
    this.TransactionsDB.write(this.transactions);
  }

}
