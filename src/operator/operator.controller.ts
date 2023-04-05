import {Body, Controller, Get, Param, Post, Req} from "@nestjs/common";
import { DB } from "../util/DB";
import { BlockchainService } from "../services/blockchain.service";
import { WalletService } from "../wallet/wallet.service";
import { Wallet } from "../util/Wallet";
import Wallets from "../wallet/Wallets";
import { ExtendedError } from "../util/ExtendedError";
import CryptoUtil from "../util/CryptoUtil";
import {Transaction} from "../util/Transaction";
import {TransactionBuilder} from "../util/TransactionBuilder";
import {Config} from "../util/Config";

@Controller('operator')
export class OperatorController {
  walletDB: DB;
  wallets: Wallet[];

  constructor(private blockchainService: BlockchainService, private walletService: WalletService) {
    this.walletDB = this.walletService.initializeWalletDB();
    this.init();
  }

  async init() {
    this.wallets = await this.walletDB.read(Wallets);
// console.log('buffer',CryptoEdDSAUtil.verifySignature('47d8c686662a4cc1facd220b146d35e64296af7f4d8468ade766529dce35e910'))
  }

  @Get('wallets')
  getAllWallets() {
    return this.wallets;
  }

  @Get('wallet/:walletId([a-zA-Z0-9]{64})')
  getWalletById(@Param('walletId') walletId: string){
    return this.wallets.find((wallet)=>wallet.id == walletId);
  }

  @Post('wallets')
  createWalletFromPassword(@Body() data){
    const wallet = this.walletService.fromPassword(data.password);
    return this.addWallet(Wallet.organizeJsonArray(wallet));
  }

  @Post('wallets/addresses')
  generateAddressForWallet(@Body() body, @Req() req){
    const wallet = this.getWalletById(body.walletId);
    if(!wallet) throw new ExtendedError("Wallet Not Found");
    if(!this.checkWalletPassword(body.walletId, req))
      throw new ExtendedError("Wallet Password doesn't match!");
    const address = wallet.generateAddress();
    this.walletDB.write(this.wallets);
    return {address};
  }

  @Get('/:addressId/balance')
  getBalanceForAddress(@Param('addressId') addressid) {
    const utxo =
        this.blockchainService.getUnspentTransactionsForAddress(addressid);

    if(utxo == null || utxo.length == 0) {
      throw new ExtendedError(`No transactions found for this addressId ${addressid}`);
    }
    let sum = 0;
    utxo.map((obj)=> {sum += obj.amount});
    return sum;
  }

  @Post('wallets/transactions')
  initiateTransactions(@Body() body, @Req() req){console.log(req.headers.walletid,req.headers.password)
    if(!this.checkWalletPassword(req.headers.walletid, req))
      throw new ExtendedError("Incorrect Password");

    const newTransaction = this.createTransaction(req.headers.walletid, body.fromAddressId, body.toAddressId, body.amount, body.changeAddressId || body.fromAddressId);

    return this.blockchainService.addTransaction(
        Transaction.organizeJsonArray(newTransaction)
    )
  }

  @Get('wallets/:walletId/addresses')
  getAddressessForWallet(@Param('walletId') walletId: string){
      const wallet = this.getWalletById(walletId);
      if(!wallet){
          throw new ExtendedError("Wallet Not Found");
      }
      return wallet.getAddresses()
  }

    checkWalletPassword(walletId, req){
        const wallet = this.wallets.find((data: Wallet)=>data.id == walletId);
        if(!wallet)throw new ExtendedError("Wallet Not Found");
        return wallet.passwordHash == CryptoUtil.hash(req.headers.password);
    }

    async addWallet(wallet: Wallet) {
        this.wallets.push(wallet);
        await this.walletDB.write(this.wallets);
        return this.wallets.length != 0 ? await this.walletDB.read(Wallets) : [];
    }

    createTransaction(walletId, fromAddressId, toAddressId, amount, changeAddressId): Transaction {
    const utxo = this.blockchainService.getUnspentTransactionsForAddress(fromAddressId);

    const wallet = this.getWalletById(walletId);
    if(!wallet) throw new ExtendedError("Wallet Not Found");

    const secretKey = wallet.getSecretKeyByAddress(fromAddressId);
    if(!secretKey)
      throw new ExtendedError("Public Key not linked to any wallet");

    const tx = new TransactionBuilder();
    tx.from(utxo);
    tx.to(toAddressId, amount);
    tx.change(changeAddressId || fromAddressId);
    tx.fee(Config.FEE_PER_TRANSACTION);
    tx.sign(secretKey);
    return Transaction.organizeJsonArray(tx.build());
    }
}
