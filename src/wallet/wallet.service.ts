import { Injectable } from '@nestjs/common';
import { DB } from "../util/DB";
import { Connection } from "../util/Connection";
import Blocks from "../blockchain/Blocks";
import Wallets from "./Wallets";
import { Wallet } from "../util/Wallet";

@Injectable()
export class WalletService {

  initializeWalletDB() {
    return new DB(`./src/data/${Connection().name}/wallet.json`,new Wallets());
  }

  fromPassword(password: string) {
    const wallet = new Wallet();
    wallet.passwordHash = "";
    wallet.id = "";
    return wallet;
  }
}
