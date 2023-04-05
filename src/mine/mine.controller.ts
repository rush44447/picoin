import {Body, Controller, Post} from '@nestjs/common';
import * as lodash from 'lodash';
import {Block} from "../util/Block";
import {BlockchainService} from "../services/blockchain.service";
import * as process from "process";
import {Config} from "../util/Config";
import {Transaction} from "../util/Transaction";
import CryptoUtil from "../util/CryptoUtil";
import {TypeEnum} from "../util/TypeEnum";

@Controller('mine')
export class MineController {

    constructor(private blockchainService: BlockchainService) {
    }

    @Post()
    mine(@Body() data){
        const block = this.generateNextBlock(data.rewardAddress, data.feeAddress);

        const transaction = lodash.countBy(block.transactions
            .toString().replace('{','').replace('}','').replace(/"/g,''));

        console.info(`Mining and checking proof of work of thew new Block ${block.transactions} ${transaction}`);

        const generateBlock = this.proveWorkFor(Block.organizeJsonArray(block), Block.difficulty(this.blockchainService.getLastBlock().hash));

        return this.blockchainService.addBlock(Block.organizeJsonArray(generateBlock));
    }

    private generateNextBlock(rewardAddress: any, feeAddress: any): Block {
        const previousBlock = this.blockchainService.getLastBlock();
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = new Date().getTime()/1000;
        const blocks = this.blockchainService.getALlBlocks();

        const candidateTransactions = this.blockchainService.getLastBlock().transactions;
        const transactionInBlocks = lodash.flatten(blocks.map(block=> block.transactions))
        const selectedTransactions = [];
        const rejectedTransactions = [];

        candidateTransactions.map((transaction)=>{
            let negativeOutputFOund = 0;
            let i = 0;
            const outputsLen = transaction.data.outputs.length;
            // Checking negative outputs
            for(i=0;i<outputsLen;i++){
                if(transaction.data.outputs[i].amount<0) {
                    negativeOutputFOund++;
                }
            }
            // Check if any input transaction found in selectedTransactions or blockchain
            const transactionInputFound = transaction.data.inputs.map((input)=> {
                const wasItFoundInSelectedTransactions = !!this.findInputTransactionInTransactionList(input, selectedTransactions);
                const wasItFoundInBlocksTransactions = !!this.findInputTransactionInTransactionList(input, transactionInBlocks);
                return (wasItFoundInBlocksTransactions || wasItFoundInSelectedTransactions)
            });

            if(transactionInputFound) {
                if(transaction.type == TypeEnum.regular && negativeOutputFOund == 0){
                    selectedTransactions.push(transaction);
                } else if(transaction.type == TypeEnum.reward) {
                    selectedTransactions.push(transaction);
                } else {
                    rejectedTransactions.push(transaction);
                }
            } else {
                rejectedTransactions.push(transaction);
            }
            console.info(`Selected Transaction has length ${selectedTransactions.length} and RejectedTransaction hash Length ${rejectedTransactions.length}`);
        });
        const transactions = selectedTransactions.length >= Config.TRANSACTION_PER_BLOCK ? selectedTransactions.splice(0,2) : [];
        if(transactions.length > 0){
            const feeTransaction = Transaction.organizeJsonArray({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: TypeEnum.fee,
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: Config.FEE_PER_TRANSACTION + transactions.length,
                            address: feeAddress
                        }
                    ]
                }
            });
            transactions.push(feeTransaction);
        }
        if(rewardAddress != null) {
            const rewardTransaction = Transaction.organizeJsonArray({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: TypeEnum.reward,
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: Config.MINING_REWARD,
                            address: rewardAddress
                        }
                    ]
                }
            });
            transactions.push(rewardTransaction);
        }

        return Block.organizeJsonArray({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            transactions
        });
    }

    private proveWorkFor(crudeBlock: Block, difficultynumber: number) {
        const block = Block.organizeJsonArray(crudeBlock);
        const startTime = process.hrtime();
        let difficulty =  null;

        do{
            block.timestamp = new Date().getTime()/1000;
            block.nonce++;
            block.hash = Block.toHash(block);
            difficulty = Block.difficulty(block.hash);
        } while(difficulty >= difficultynumber)

        console.info(`Block found time: ${process.hrtime(startTime)[0]} sec, difficulty ${difficulty} hash ${block.hash} nonce ${block.nonce}`);
        return block;
    }

    private findInputTransactionInTransactionList(input, selectedTransactions: any[]) {
        const inputTransactionsInTransaction = lodash.flatten(selectedTransactions.map((transact)=> transact.data.inputs));

        return inputTransactionsInTransaction.find((inputObj)=> input.transaction == inputObj.transaction && input.index == inputObj.index );
    }
}
