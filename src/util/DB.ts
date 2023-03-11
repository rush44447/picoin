import * as fs from "fs";
import * as path from "path";
import { BlockchainAssertionError } from "../blockchain/BlockchainAssertionError";

export class DB {
  filePath: string;
  defaultData: any;

  constructor(filePath, defaultData) {
    this.filePath = filePath;
    this.defaultData = defaultData;
  }

  read(prototype) {
    if(!fs.existsSync(this.filePath))return this.defaultData;
    const fileContent = JSON.parse(fs.readFileSync(this.filePath).toString());
    if(fileContent.length == 0) return this.defaultData;
    return prototype ? prototype.fromJsonArray(fileContent) : fileContent;
  }

  write(data) {
    if(!fs.existsSync(path.dirname(this.filePath))) throw BlockchainAssertionError;
    fs.writeFileSync(this.filePath, JSON.stringify(data));
  }
}