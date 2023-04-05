import CryptoUtil from "./CryptoUtil";
import {ExtendedError} from "./ExtendedError";
import CryptoEdDSAUtil from "./CryptoEdDSAUtil";
import {Config} from "./Config";

export class Transaction {
    id: string;
    hash: string;
    type: string;
    data: any;

    constructor() {
        this.id = null;
        this.hash = null;
        this.type = null;
        this.data = {
            inputs: [],
            outputs: []
        }
    }

    static organizeJsonArray(transaction) {
        const data = new Transaction();
        const keys = Object.keys(transaction);
        keys.forEach((key)=> {
            if(key == 'data' && data[key]){
                data[key] = {
                    inputs: transaction[key].inputs,
                    outputs: transaction[key].outputs,
                }
            } else {
                data[key]=transaction[key];
            }
        });
        data.hash = data.toHash();
        return data;
    }

    toHash() {
        return CryptoUtil.hash(this.id + this.type + JSON.stringify(this.data));
    }

    check() {
        const checkHash = this.hash == this.toHash();
        if(!checkHash) throw new ExtendedError("Hash not correct");

        this.data.inputs.map((obj)=>{
            const hash = CryptoUtil.hash({
                transaction: obj.transaction,
                index: obj.index,
                address: obj.address
            });
            const validTransaction = CryptoEdDSAUtil.verifySignature(obj.address, obj.signature, hash);
            if(!validTransaction) throw new ExtendedError("Transaction Not Correct");
        });

        if(this.type == 'regular'){
            let inputTransaction = 0;
            this.data.inputs.map((data)=> {
                inputTransaction += data.amount;
            });

            let outputTransaction = 0;
            let negativeOutput = 0;
            this.data.outputs.map((data)=> {
                outputTransaction += data.amount;
                if(data.amount < 0) negativeOutput++;
            });

            const isInputAmountGreaterThanOutputAmount = inputTransaction >= outputTransaction;
            if(!isInputAmountGreaterThanOutputAmount)
                throw new ExtendedError("Invalid Transaction History");
            const isEnoughFee = (inputTransaction - outputTransaction) >= Config.FEE_PER_TRANSACTION;
            if(!isEnoughFee) throw new ExtendedError("Not Enough Fee");
            if(negativeOutput > 0)  throw new ExtendedError("Not Enough Balance");
            return true;
        }
    }
}