import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from "@nestjs/config";
import { Connection } from "./util/Connection";
import { BlockchainController } from './blockchain/blockchain.controller';
import { BlockchainService } from "./blockchain/blockchain.service";
import { OperatorController } from './operator/operator.controller';
import { WalletService } from './wallet/wallet.service';

enum nodeEnvironment {
  NODEA = 'nodea',
  NODEB = 'nodeb',
  NODEC = 'nodec',
}

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: `${process.cwd()}/.env.${nodeEnvironment.NODEA}`,
    load: [Connection]
  })],
  controllers: [AppController, BlockchainController, OperatorController],
  providers: [AppService, BlockchainService, WalletService],
})
export class AppModule {}

