const [requires, func] = [
  '::express, api, async-wrapper, error, ::bignumber.js, services.Wallet',
  (express, api, wrap, error, BigNumber, WalletService) => {
    const router = express.Router();

    const handler = wrap(async (req, res, next) => {
      const { address, value, transaction_hash, confirmations } = req.query;
      if (parseInt(confirmations) == 3) {
        const amount = new BigNumber(value).times('1e-8').toString();
        // TODO: check tx, check duplicate
        await WalletService.depositBtcToAddress(
          address,
          amount,
          transaction_hash
        );
      }
      res.sendStatus(200);
    });

    router.get('/receive', handler);
    router.post('/', handler);

    api.use('/btc', router);
  }
];

module.exports = {
  require: requires,
  func
};
