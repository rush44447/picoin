import * as crypto from 'crypto';

export default class CryptoUtil {
  static hash(data){
    const payload = typeof data == 'object' ? JSON.stringify(data): data.toString();
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  static randomId(size = 64){
    return crypto.randomBytes(Math.floor(size/2)).toString('hex');
  }
}