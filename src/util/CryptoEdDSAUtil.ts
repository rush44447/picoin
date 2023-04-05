import * as Crypto from "crypto";
import * as elliptic from "elliptic";

const EdDSA = elliptic.eddsa;
const ec = new EdDSA('ed25519');
const SALT = "9678b19712982284d7096ab4097d1d5e4fbe757b24f1515ed1754672e65b014e"

export default class CryptoEdDSAUtil {
    static generateSecret(password){
        return Crypto.pbkdf2Sync(password, SALT, 10000, 512, 'sha256').toString('hex');
    }

    static generateKeyPairFromSecret(seed: string) {
        return ec.keyFromSecret(seed);
    }

    static toHex(data: string) {
        return elliptic.utils.toHex(data);
    }

    static verifySignature(publicKey, signature, messageHash){
        const key = ec.keyFromPublic(publicKey, 'hex');
        const verified = key.verify(messageHash, signature);
        console.debug(`Verified ${verified}`);
        return verified;
    }

    static signHash(keyPair, messageHash){
        return keyPair.sign(messageHash).toHex().toLowerCase();
    }
}