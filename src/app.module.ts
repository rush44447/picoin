import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { Connection } from "./util/Connection";
import { BlockchainController } from './blockchain/blockchain.controller';
import { BlockchainService } from "./services/blockchain.service";
import { OperatorController } from './operator/operator.controller';
import { WalletService } from './wallet/wallet.service';
import { NodeController } from './node/node.controller';
import { MineController } from './mine/mine.controller';
import {HttpModule} from "@nestjs/axios";
import {AppService} from "./app.service";
import {AppController} from "./app.controller";

enum nodeEnvironment {
  NODEA = 'nodea',
  NODEB = 'nodeb',
  NODEC = 'nodec',
}

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: `${process.cwd()}/.env.${nodeEnvironment.NODEA}`,
    load: [Connection]
  }), HttpModule],
  controllers: [ AppController, BlockchainController, OperatorController, NodeController, MineController],
  providers: [ AppService, BlockchainService, WalletService],
})
export class AppModule {}

