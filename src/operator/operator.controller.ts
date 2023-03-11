import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { DB } from "../util/DB";
import { BlockchainService } from "../blockchain/blockchain.service";
import { WalletService } from "../wallet/wallet.service";
import { Wallet } from "../util/Wallet";
import Wallets from "../wallet/Wallets";
import { ExtendedError } from "../util/ExtendedError";
import CryptoUtil from "../util/CryptoUtil";

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

  checkWalletPassword(walletId, req){
    const wallet = this.wallets.find((data: Wallet)=>{wallet.id == walletId});
    if(!wallet)throw new ExtendedError("Wallet Not Found");
    return wallet.passwordHash == CryptoUtil.hash(req.headers.password);
  }

  async addWallet(wallet: Wallet) {
    this.wallets.push(wallet);
    await this.walletDB.write(this.wallets);
    return this.wallets.length != 0 ? await this.walletDB.read(Wallets) : [];
  }
}
