import {Body, Controller, Get, HttpException, Param, Post} from '@nestjs/common';
import {Connection} from "../util/Connection";
import {BlockchainService} from "../services/blockchain.service";
import {EmitterService} from "../services/emitter";
import {HttpService} from "@nestjs/axios";
import {catchError, map} from "rxjs";
import {Block} from "../util/Block";
import {Transaction} from "../util/Transaction";
import * as lodash from 'lodash';
import Blocks from "../blockchain/Blocks";
import Transactions from "../blockchain/Transactions";

@Controller('node')
export class NodeController {
    host: string;
    port: string;
    peers: any[];

    constructor(private blockchainService: BlockchainService, private httpService: HttpService) {
        this.host = Connection().host;
        this.port = String(Connection().port);
        this.peers = [];
        this.init();
    }

    init() {
        this.hookBlockchain();
        this.connectToPeers(Connection().peers);
    }

    initConnection(peer) {
       this.getLatestBlock(peer);
       this.getTransactions(peer);
    }

    @Post('peers')
    connectToPeer(@Body() body){
        this.connectToPeers([body]);
        return body;
    }


    @Get('peers')
    getAllPeers() {
        return this.peers;
    }

    @Get('transactions/:transactionId/confirmations')
    getConfirmations(@Param('transactionId') transactionId: string){
        // Get data from all peers if the transaction has been confirmed
        const foundLocally = this.blockchainService.getTransactionFromBlocks(transactionId) != null;
        return Promise.all(
            this.peers.map((peer)=> this.getConfirmation(peer, transactionId)),
        ).then((response)=> {
            return lodash.sum([foundLocally, ... response]);
        });
    }

    connectToPeers(newPeers){
        // Connect to every peer
        const me = `http://${this.host}:${this.port}`;
        newPeers.forEach((peer) => {
            // If it is  already connected to this peer, ignore
            if(!this.peers.find((element)=> element.url == peer.url) && peer.url != me) {
                this.sendPeer(peer, {url: me});
                console.info(`Peer ${peer.url} added to connection`);
                this.peers.push(peer);
                this.initConnection(peer)
            } else {
                console.info(`Peer ${peer.url} not added to connections, because its already there`)
            }
        })
    }

    getConfirmation(peer, transactionId) {
        const self = this;
        const URL = `${peer.url}/blockchain/transactions/${transactionId}`;
        console.info(`Checking transactions from ${URL}`);
        return this.httpService.get(URL).pipe(
            map((response) => true),
            catchError((error)=> {
                throw new HttpException(error.response.data, error.response.status)
            })
        ).toPromise();
    }

    getLatestBlock(peer) {
        const self = this;
        const URL = `${peer.url}/blockchain/blocks/latest`;
        console.info(`Getting latest block from ${URL}`);
        return this.httpService.get(URL).pipe(
            map((response) => self.checkReceivedBlock(Block.organizeJsonArray(response.data))),
            catchError((error)=> {
                throw new HttpException(error.response.data, error.response.status)
            })
        ).toPromise();
    }

    getBlocks(peer) {
        const self = this;
        const URL = `${peer.url}/blockchain`;
        console.info(`Getting blocks from: ${URL}`);
        return this.httpService.get(URL).pipe(
            map((response) => self.checkReceivedBlocks(Blocks.fromJsonArray(response.data))),
            catchError((error)=> {
                throw new HttpException(error.response.data, error.response.status)
            })
        ).toPromise();
    }

    getTransactions(peer) {
        const self = this;
        const URL = `${peer.url}/blockchain/transactions`;
        console.info(`Getting transactions from ${URL}`);
        return this.httpService.get(URL).pipe(
            map((response) => self.syncTransaction(Transactions.fromJsonArray(response.data))),
            catchError((error)=> {
                throw new HttpException(error.response.data, error.response.status)
            })
        ).toPromise();
    }

    syncTransaction(transactions: Transaction[]) {
        transactions.map((transaction)=> {
            const transactionFound = this.blockchainService.getTransactionById(transaction);
            if (transactionFound == null) {
                console.info(`Syncing transaction '${transaction.id}'`);
                this.blockchainService.addTransaction(transaction);
            }
        })
    }

    sendPeer(peer, peerToSend) {
        const URL = `${peer.url}/node/peers`;
        console.info(`Sending ${peerToSend.url} to peer ${URL}`);
        return this.httpService.post(URL, peerToSend).pipe(
            map((response) => response.data),
            catchError((error)=> {
                throw new HttpException(error.response.data, error.response.status)
            })
        ).toPromise();
    }

    checkReceivedBlock(block){
        return this.checkReceivedBlocks([block])
    }

     checkReceivedBlocks(blocks: Block[]){
        const receivedBlocks = blocks.sort((b1, b2)=> b1.index - b2.index);
        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestBlockHeld = this.blockchainService.getLastBlock();

        if(latestBlockReceived.index <= latestBlockHeld.index){
            console.info(`Received blockchain is not longer than our blockchain. DO Nothing. `);
            return false;
        }

        if(latestBlockReceived.hash <= latestBlockHeld.previousHash){
            console.info(`Received blockchain is appendable to our blockchain.`);
            this.blockchainService.addBlock(latestBlockReceived);
            return true;
        } else if(receivedBlocks.length == 1) {
            console.log(`Querying chain from our peers`);
            this.broadcast(this.getBlocks);
        } else {
            this.blockchainService.replaceChain(receivedBlocks);
            return true;
        }
     }

    sendLatestBlock(peer, block) {
        const URL = `${peer.url}/blockchain/blocks/latest`;
        console.info(`Posting latest block to ${URL}`);
        return this.httpService.put(URL, block).pipe(
            map((response) => response.data),
            catchError((error)=> {
                throw new HttpException(error.response.data, error.response.status)
            })
        ).toPromise();
    }

    sendTransaction(peer, transaction){
        const URL = `${peer.url}/blockchain/transactions`;
        console.info(`Posting transaction to ${URL}`);
        return this.httpService.post(URL, transaction).pipe(
            map((response) => response.data),
            catchError((error)=> {
                throw new HttpException(error.response.data, error.response.status)
            })
        ).toPromise();
    }

     hookBlockchain(){
        EmitterService.getEmitter().on('blockAdded',(block) =>{
            this.broadcast(this.sendLatestBlock, block)
        });
         EmitterService.getEmitter().on('transactionAdded',(transact) => {
             this.broadcast(this.sendTransaction, transact)
         });
         EmitterService.getEmitter().on('blockchainReplaced',(blocks) => {
             this.broadcast(this.sendLatestBlock, blocks[blocks.length - 1])
         });
     }

    broadcast(fn, ...args) {
        console.log(`Commencing Broadcast`);
        this.peers.map((peer)=> {fn.apply(this, [peer, ...args])}, this);
    }


}
