import { Injectable } from '@nestjs/common';
import { DB } from "../util/DB";
import { Connection } from "../util/Connection";
import Blocks from "../blockchain/Blocks";
import Transactions from "../blockchain/Transactions";
import {Transaction} from "../util/Transaction";
import {ExtendedError} from "../util/ExtendedError";
import {TransactionAssertionError} from "../blockchain/TransactionAssertionError";
import {Block} from "../util/Block";
import {BlockchainAssertionError} from "../blockchain/BlockchainAssertionError";
import {Config} from "../util/Config";
import * as lodash from 'lodash';
import {EmitterService} from "./emitter";

@Injectable()
export class BlockchainService {
  blocks: Blocks;
  transactions: Transactions;


  initializeBlocksDB() {
    return new DB(`./src/data/${Connection().name}/blocks.json`,new Blocks());
  }
  initializeTransactionsDB() {
    return new DB(`./src/data/${Connection().name}/transactions.json`,new Transactions());
  }

  getALlBlocks() {
    return this.blocks;
  }

  mapper(transactions: Transaction[], address: string, txinput, txoutput) {
    transactions.map((transaction: Transaction) => {
      let index = 0;
      transaction.data.outputs.map((output: any) => {
        if (address && output.address == address)
          txoutput.push({
            index,
            address: output.address,
            amount: output.amount,
            transaction: transaction.id,
          });
        index++;
      });

      transaction.data.inputs.map((input: any) => {
        if (address && input.address == address){
          txinput.push({
            ...input,
          })
        }
      });
    });
  }

  checkChain(blocks: Block[]){
    if(JSON.stringify(blocks[0])!==JSON.stringify(Block.genesis)){
      throw new BlockchainAssertionError("First element of the chain is invalid");
    }

    for(let i=1;i< blocks.length; i++){
      this.checkBlock(blocks[i], blocks[i-1], blocks);
    }
  }

  checkBlock(newBlock, oldBlock, blocks = this.blocks){
    /*
    * 1. Check Indices
    * 2. Check Hashes
    * 3. check hash of newblock if it doesnt have any missing properties
    * 4. check difficulty of block , is inline with the accepted diificulty of the blockchain
    * 5. call checktransactions
    * 6. input transaction AMOUNTS is equal to the output transaciont amount
    * 7. double spend - is there are any unspent output transactions being used more than once
    * 8. check if a single block input transaction data has not mmore than 1 fee and 1 reward
    * */
    if(oldBlock.index + 1 != newBlock.index){
      throw new BlockchainAssertionError("Indices doesn't match");
    }

    if(oldBlock.hash != newBlock.previousHash){
      throw new BlockchainAssertionError("Hashes doesn't match");
    }

    const blockHash = Block.toHash(newBlock);
    if(blockHash != newBlock.hash){
      throw new BlockchainAssertionError("Hash of next block not proper");
    }
console.log(Block.difficulty(newBlock.hash))
console.log(Config.pow.getDifficulty(blocks,newBlock.index))
    if(Block.difficulty(newBlock.hash) >= Config.pow.getDifficulty(blocks,newBlock.index)){
      throw new BlockchainAssertionError("Invalid Proof of Work");
    }

    newBlock.transactions.map((transact: Transaction)=> this.checkTransaction(Transaction.organizeJsonArray(transact), blocks));

    let sumOfOutputTransactions = 0;
    let sumOfInputTransactions = 0;

    newBlock.transactions.map((transaction)=>{
      transaction.data.outputs.map((output)=> sumOfOutputTransactions += output.amount || 0)
      transaction.data.inputs.map((input)=> sumOfInputTransactions += input.amount || 0)
    });

    sumOfInputTransactions += Config.MINING_REWARD;
    const isInputsAmountGreaterOrEqualToOutputAmount = sumOfInputTransactions >= sumOfOutputTransactions;

    if(!isInputsAmountGreaterOrEqualToOutputAmount)
      throw new BlockchainAssertionError("Invalid Block Balance");

    const transactionList = lodash.flatten(newBlock.transactions.map((transactobj) =>
        transactobj.data.inputs.length > 0 ? transactobj.data.inputs : [])).map((data) => `${data.transaction} | ${data.index}`);

    const doublespendList = lodash.forOwn(lodash.countBy(transactionList), (value, key)=> value >=2 ? key : null);

    if(doublespendList && doublespendList.length > 0){
      throw new BlockchainAssertionError("Double Spend Error in the block transactions");
    }

    const type = lodash.countBy(newBlock.transactions.map((x)=> x.type));

    if(type.FEE && type.FEE >1){
      throw new TransactionAssertionError(`Invalid fee transaction count: expected 1, found ${type.FEE}`)
    }
    if(type.REWARD && type.REWARD >1){
      throw new TransactionAssertionError(`Invalid reward transaction count: expected 1, found ${type.REWARD}`)
    }

    return true;
  }

  getUnspentTransactionsForAddress(addressid) {
    const txinput = [];
    const txoutput = [];

    this.blocks.map((block) =>
        this.mapper(block.transactions, addressid, txinput, txoutput),
    );

    this.mapper(this.transactions, addressid, txinput, txoutput);

    const unspentTransactions = [];

    txoutput.map((output)=> {
      if(!txinput.find((input)=> input.index == output.index && input.transaction == output.transaction)){
        unspentTransactions.push(output);
      }
    });
    return unspentTransactions;
  }

  addTransaction(transaction: Transaction, emit = true) {
    if(this.checkTransaction(transaction)){
      this.transactions.push(transaction);
      this.writeTransaction();
      console.log(`Transaction added ${transaction.id}`);
      if(emit) EmitterService.getEmitter().emit('transactionAdded', transaction);
      return transaction;
    }
  }

  async writeTransaction() {
    await this.initializeTransactionsDB().write(this.transactions);
  }

  async writeBlock() {
    await this.initializeBlocksDB().write(this.blocks);
  }

  checkTransaction(transaction: Transaction, referenceBlocks = this.blocks) {
/*
* 1. check Transaction
* 2. Verify is the transactions isn't already there in the blockchain
* 3. verify if all the input transactions are unspent in the blockchain
* */
    transaction.check();
    const IsNotAlreadyPresent = referenceBlocks.map((block)=>{
      return block.transactions.find((transaction)=> transaction.id == block.transactions.id) == undefined
    });

    if(!IsNotAlreadyPresent)
      throw new ExtendedError(`${transaction.id} is already present in the blockchain`)

    let IsNotSpent = true;
    const listTransactions = [];

    referenceBlocks.map((block)=>{
      block.transactions.map((transact)=>{
        if(transact.data.inputs.length > 0){
          listTransactions.push(...transact.data.inputs);
        }
      })
    });

    transaction.data.inputs.map((transaction)=> {
      IsNotSpent = IsNotSpent && !listTransactions.find((data) => data.transaction == transaction.transactions && data.index == transaction.index)
    });
    if(!IsNotSpent)
      throw new TransactionAssertionError('Input transaction spent');

    return true;
  }

  getLastBlock() {
    return this.blocks.length > 0 ? this.blocks[this.blocks.length - 1] : [];
  }

  async addBlock(block, emit = true) {
    if(this.checkBlock(block, this.getLastBlock())){
      this.blocks.push(block);
      this.writeBlock()
    }
    console.log(`Block added ${block.hash}`);
    if(emit) EmitterService.getEmitter().emit('blockAdded', block);
    return block;
  }

  replaceChain(newBlockchain, blocks = this.blocks) {
    if(newBlockchain.length <= blocks.length)
      throw new BlockchainAssertionError("Received Blockchain shorter than current Blockchain");

    this.checkChain(newBlockchain);
    newBlockchain.slice(blocks.length - newBlockchain.length).map((block)=> this.addBlock(block, false));

    EmitterService.getEmitter().emit('blockchainReplaced', blocks);
    return blocks;
  }

  getTransactionById(transaction) {
    return this.transactions.find((transactionObj)=> transactionObj.id == transaction.id);
  }

  getTransactionFromBlocks(transactionId: string) {
    return this.blocks.map((block)=> block.transactions.find((transaction)=> transaction.id == transactionId )).filter((item) => item);
  }
}
