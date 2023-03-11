import { Injectable } from '@nestjs/common';
import { DB } from "../util/DB";
import { Connection } from "../util/Connection";
import Blocks from "./Blocks";

@Injectable()
export class BlockchainService {
  initializeBlocksDB() {
    return new DB(`./src/data/${Connection().name}/blocks.json`,new Blocks());
  }
}
