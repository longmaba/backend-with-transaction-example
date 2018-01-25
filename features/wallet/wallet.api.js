const [requires, func] = [
  '::express, checkLoggedIn,checkTfa, api, async-wrapper, error, services.Wallet, services.Price, queue, web3, ::bignumber.js',
  (
    express,
    checkLoggedIn,
    checkTfa,
    api,
    wrap,
    error,
    WalletService,
    PriceService,
    queue,
    web3,
    BigNumber
  ) => {
    let router = express.Router();

    router.get(
      '/info',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { address, btcAddress } = await WalletService.touchWallet(
          req.user._id
        );
        res.send({ address, btcAddress });
      })
    );

    router.post(
      '/buyCFX',
      checkLoggedIn(),
      checkTfa(),
      wrap(async (req, res, next) => {
        let { total, address, currency } = req.body;
        const { ethToUsd, btcToUsd } = await PriceService.getCurrentPrices();
        total = new BigNumber(total);
        let totalInUsd;
        currency = currency.toLowerCase();
        if (currency === 'eth') {
          totalInUsd = total.times(ethToUsd);
        } else if (currency === 'btc') {
          totalInUsd = total.times(btcToUsd);
        }
        if (totalInUsd.gte(2000)) {
          total = total.times(1.03);
        } else if (totalInUsd.gte(5000)) {
          total = total.times(1.05);
        } else if (totalInUsd.gte(10000)) {
          total = total.times(1.07);
        }
        total = total.toFixed(8);
        if (currency === 'eth') {
          await WalletService.buyCfxWithEthereum(req.user, total, address);
        } else if (currency === 'btc') {
          await WalletService.buyCfxWithBitcoin(req.user, total, address);
        }
        res.sendStatus(200);
      })
    );

    router.get(
      '/balance',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const {
          cfxBalance,
          ethBalance,
          btcBalance
        } = await WalletService.balance(req.user._id);
        res.send({
          cfxBalance: cfxBalance.toFixed(8),
          ethBalance: web3.fromWei(ethBalance, 'ether').toFixed(8),
          btcBalance: btcBalance.toFixed(8)
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
