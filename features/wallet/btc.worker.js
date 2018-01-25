const [requires, func] = [
  '::express, api, async-wrapper, error, ::bignumber.js, services.Wallet',
  (express, api, wrap, error, BigNumber, WalletService) => {
    const router = express.Router();

    // GET /api/btc/receive?address=15GuseaZG45sGgE1oBeugDhLeWwZVmDVKH&transaction_hash=319c3b4cc2480af49117da007aec2eae381a78ff4663079f4f1c1a55eaf840d1&value=70000&confirmations=0
    const handler = wrap(async (req, res, next) => {
      const { address, value, transaction_hash, confirmations } = req.query;
      if (parseInt(confirmations) >= 3) {
        const amount = new BigNumber(value).times('1e-8').toString();
        await WalletService.depositBtcToAddress(
          address,
          amount,
          transaction_hash
        );
      }
      res.sendStatus(200);
    });

    router.get('/', handler);
    router.post('/', handler);

    api.use('/btc', router);
  }
];

module.exports = {
  require: requires,
  func
};
