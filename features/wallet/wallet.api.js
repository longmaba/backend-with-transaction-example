const [requires, func] = [
  '::express, checkLoggedIn, api, async-wrapper, error, services.Wallet, queue, web3',
  (express, checkLoggedIn, api, wrap, error, WalletService, queue, web3) => {
    let router = express.Router();

    router.get(
      '/info',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const wallet = await WalletService.touchWallet(req.user._id);
        res.send(wallet.address);
      })
    );

    router.post(
      '/buyCFX',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { amount, address } = req.body;
        await WalletService.buyCFX(req.user, amount, address);
        res.sendStatus(200);
      })
    );

    router.get(
      '/balance',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { cfxBalance, ethBalance } = await WalletService.balance(
          req.user._id
        );
        res.send({
          cfxBalance: cfxBalance.toFixed(8),
          ethBalance: web3.fromWei(ethBalance, 'ether').toFixed(8)
        });
      })
    );

    router.get(
      '/check/eth/:tx',
      wrap(async (req, res, next) => {
        await queue
          .create('ethRetry', {
            tx: req.params.tx
          })
          .save();
        res.sendStatus(200);
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
