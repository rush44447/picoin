export const Config = {
  genesisBlock: {
    index: 0,
    previousHash: "",
    timestamp: 1678374419,
    nonce: 0,
    transactions: [],
    hash: '9678b19712982284d7096ab4097d1d5e4fbe757b24f1515ed1754672e65b014e'
  },
  MINING_REWARD: 5000,
  FEE_PER_TRANSACTION: 10,
  TRANSACTION_PER_BLOCK: 2,
  pow: {
    getDifficulty(blocks, index?) {
      const BASE_DIFFICULTY = Number.MAX_SAFE_INTEGER;
      const EVERY_X_BLOCK = 5;
      const POW_CURVE = 5;
        return Math.max(Math.floor(BASE_DIFFICULTY / Math.pow(Math.floor(((index || blocks.length)+1)/EVERY_X_BLOCK )+1, POW_CURVE)), 0);
    }
  }
}