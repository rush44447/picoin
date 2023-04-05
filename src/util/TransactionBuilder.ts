import {ExtendedError} from "./ExtendedError";
import CryptoEdDSAUtil from "./CryptoEdDSAUtil";
import CryptoUtil from "./CryptoUtil";
import {Transaction} from "./Transaction";
import {TypeEnum} from "./TypeEnum";

export class TransactionBuilder {
    amount: number;
    utxo: any;
    toAddressId: string;
    changeAddressId: string;
    type: string;
    feeamount: number;
    secretId: string;

    constructor() {
        this.amount = 0;
        this.feeamount = 0;
        this.secretId = null;
        this.toAddressId = null;
        this.changeAddressId = null;
        this.utxo = null;
        this.type = TypeEnum.regular;
    }

    from(utxo) {
        this.utxo = utxo;
        return this;
    }

    to(toAddress, amount){
        this.toAddressId = toAddress;
        this.amount = amount;
        return this;
    }

    change(changeAddress){
        this.changeAddressId = changeAddress;
        return this;
    }

    fee(fee){
        this.feeamount = fee;
        return this;
    }

    settype(type){
        this.type = type;
        return this;
    }

    sign(secretKey){
        this.secretId = secretKey;
        return this;
    }

    build() {
        if(!this.utxo)throw new ExtendedError("Unspent Transaction is Required");
        if(!this.toAddressId)throw new ExtendedError("Recipient Address is Required");
        if(!this.amount)throw new ExtendedError("Amount is Required");

        let unspentamount = 0;
        this.utxo.map((transaction)=>{unspentamount += transaction.amount});
        const changeAmount = unspentamount - this.amount - this.feeamount;
        const secretId = this.secretId;

        const inputs = this.utxo.map((objutxo)=>{
            objutxo.signature = CryptoEdDSAUtil.signHash(CryptoEdDSAUtil.generateKeyPairFromSecret(secretId), CryptoUtil.hash({
                transaction: objutxo.transaction,
                index: objutxo.index,
                address: objutxo.address
            }))
            return objutxo;
        });

        const outputs = [];
        outputs.push({
            amount: this.amount,
            address: this.toAddressId,
        });

        if(unspentamount > 0){
            outputs.push({
                amount: changeAmount,
                address: this.changeAddressId,
            })
        } else {
            throw new ExtendedError("Not Enough Balance available in the wallet");
        }

        return Transaction.organizeJsonArray({
            id: CryptoUtil.randomId(64),
            hash: null,
            type: this.type,
            data: {
                inputs,
                outputs
            }
        });
    }
}