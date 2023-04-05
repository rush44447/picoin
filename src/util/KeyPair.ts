import KeyPairs from "../wallet/KeyPairs";

export class KeyPair {
    index: number;
    secretKey: string;
    publicKey: string;

    static organizeJsonArray(keypair) {
       if(keypair.hasOwnProperty('index') &&
           keypair.hasOwnProperty('secretKey') &&
           keypair.hasOwnProperty('publicKey'))
        return keypair;
       return null;
    }

}