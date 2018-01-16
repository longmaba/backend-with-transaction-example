const [requires, func] = [
  '::express, checkLoggedIn, api, async-wrapper, error, services.Wallet',
  (express, checkLoggedIn, api, wrap, error, WalletService) => {
    let router = express.Router();

    router.get(
      '/info',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const wallet = await WalletService.touchWallet(req.user._id);
        res.send(wallet);
      })
    );

    router.post(
      '/buyCFX',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { amount, address } = req.body;
        await WalletService.buyCFX(req.user._id, amount, address);
        res.sendStatus(200);
      })
    );

    router.get(
      '/balance',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        res.send(await WalletService.balance(req.user._id));
      })
    );

    router.get(
      '/transactions',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        res.send(await WalletService.getTransactions(req.user._id));
      })
    );

    api.use('/wallet', router);
  }
];

module.exports = {
  require: requires,
  func
};
