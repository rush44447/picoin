import {Transaction} from "../util/Transaction";

export default class Transactions extends Array {
    static fromJsonArray(data) {
        const transactions = new Transactions();
        if(Array.isArray(data)){
            data.map((obj)=>{
                transactions.push(Transaction.organizeJsonArray(obj));
            })
        }
        return transactions;
    }
}