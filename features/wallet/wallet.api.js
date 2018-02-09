const [requires, func] = [
  `::express, checkLoggedIn,checkTfa, api, 
  async-wrapper, error, throwError,
  services.Wallet, services.Price, queue, web3, ::bignumber.js, config`,
  (
    express,
    checkLoggedIn,
    checkTfa,
    api,
    wrap,
    error,
    throwError,
    WalletService,
    PriceService,
    queue,
    web3,
    BigNumber,
    config
  ) => {
    let router = express.Router();

    const appName = process.env.appName || config.appName;

    router.get(
      '/info',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { address } = await WalletService.touchWallet(req.user._id);
        res.send({ address });
      })
    );

    router.post(
      '/buyCFX',
      throwError('You cannot purchase CFX at this moment.', 501),
      checkLoggedIn(),
      checkTfa(),
      wrap(async (req, res, next) => {
        let { total, address } = req.body;
        const { ethToUsd, btcToUsd } = await PriceService.getCurrentPrices();
        total = parseFloat(total);
        total = total.toFixed(8);
        total = new BigNumber(total);
        // if (currency === 'eth') {
        await WalletService.buyCfxWithEthereum(req.user, total, address);
        // } else if (currency === 'btc') {
        // await WalletService.buyCfxWithBitcoin(req.user, total, address);
        // }
        res.sendStatus(200);
      })
    );

    router.get(
      '/balance',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const {
          cfxBalance,
          ethBalance
          // btcBalance
        } = await WalletService.balance(req.user._id);
        res.send({
          cfxBalance: cfxBalance.toFixed(8),
          ethBalance: web3.fromWei(ethBalance, 'ether').toFixed(8)
          // btcBalance: btcBalance.toFixed(8)
        });
      })
    );

    router.get(
      '/check/eth/:tx',
      wrap(async (req, res, next) => {
        await queue
          .create(`${appName}:ethRetry`, {
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
        let transactions = await WalletService.getTransactions(req.user._id);
        transactions = transactions.map(t => {
          if (t.currency === 'eth') {
            t.amount = web3.fromWei(t.amount, 'ether');
          }
          return t;
        });
        res.send(transactions);
      })
    );

    api.use('/wallet', router);
  }
];

module.exports = {
  require: requires,
  func
};
