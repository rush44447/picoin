export class Wallet {
  id: string;
  passwordHash: string;
  secret: string;
  keyPairs: any;

  constructor() {
    this.id=null;
    this.passwordHash=null;
    this.secret=null;
    this.keyPairs=[];
  }

  static organizeJsonArray(wallet) {
    const data = new Wallet();
    const keys = Object.keys(wallet);
    keys.forEach((key)=> {
      data[key]=wallet[key];
    });
    return data;
  }
}