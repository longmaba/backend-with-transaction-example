const [requires, func] = [
  'models.Wallet, models.Transaction, models.User, ::crypto, ::ethereumjs-util, web3, ::ethereumjs-tx, ::bignumber.js, error, Fawn, mongoose, ::request-promise, ::validate.js',
  (
    Wallet,
    Transaction,
    User,
    crypto,
    ethUtils,
    web3,
    EthereumTx,
    BigNumber,
    error,
    Fawn,
    mongoose,
    request,
    validate
  ) => {
    WalletService = {};

    validate.validators.validAddress = async address => {
      if (!address) {
        return;
      }
      const userId = await Wallet.findOne({ address });
      if (!userId) {
        return 'is not valid!';
      }
    };

    validate.validators.isBalanceEnough = async ({ userId, total }) => {
      const { ethBalance } = await WalletService.balance(userId);
      total = new BigNumber(total);
      if (total.gt(ethBalance)) {
        return 'is not enough';
      }
    };

    WalletService.touchWallet = async id => {
      let wallet = await Wallet.findOne({ userId: id });
      if (wallet) {
        return wallet;
      }
      return await WalletService.createWallet(id);
    };

    WalletService.createWallet = async id => {
      const randbytes = crypto.randomBytes(32);
      const address = ethUtils.privateToAddress(randbytes);
      return await Wallet.create({
        userId: id,
        address: `0x${address.toString('hex')}`,
        privateKey: randbytes
      });
    };
    // TODO: Lock
    WalletService.balance = async id => {
      const transactions = await Transaction.find({
        userId: id
      });
      let ethBalance = new BigNumber(0);
      let cfxBalance = new BigNumber(0);
      for (let transaction of transactions) {
        if (transaction.currency === 'eth') {
          ethBalance = ethBalance.plus(transaction.amount);
        } else if (transaction.currency === 'cfx') {
          cfxBalance = cfxBalance.plus(transaction.amount);
        }
      }
      return { ethBalance, cfxBalance };
    };

    WalletService.getUserIdByAddress = async address => {
      const wallet = await Wallet.findOne({ address });
      if (!wallet) {
        throw error(404, 'Wallet not found!');
      }
      return wallet.userId;
    };

    WalletService.transferToMain = async (fromAddress, amount) => {
      const gas = 21000;
      const gasPrice = await getGasPrice();
      const totalGas = new BigNumber(gas).mul(gasPrice);
      const wallet = await Wallet.findOne({ address: fromAddress });
      if (!wallet) {
        throw error(404, 'Wallet not found');
      }
      await transferEth(
        fromAddress,
        config.ethMainAddress.address,
        new BigNumber(amount).sub(totalGas),
        wallet.privateKey
      );
    };

    const transferEth = async (fromAddress, toAddress, amount, fromPrivate) => {
      const count = await web3.eth.getTransactionCount(fromAddress);
      amount = new BigNumber(amount);
      const gasPrice = await getGasPrice();
      const txParams = {
        nonce: `0x${count.toString(16)}`,
        gasPrice: `0x${new BigNumber(gasPrice).toString(16)}`,
        gasLimit: `0x${new BigNumber(21000).toString(16)}`,
        to: toAddress,
        value: `0x${amount.toString(16)}`
      };
      const tx = new EthereumTx(txParams);
      tx.sign(fromPrivate);
      const serializedTx = tx.serialize();
      return await sendRawTransaction(serializedTx);
    };

    WalletService.depositEth = async (userId, amount, txid) => {
      try {
        return await Transaction.create({
          userId,
          amount: amount.toString(),
          date: new Date(),
          key: `eth:deposit:${txid}`,
          data: {
            type: 'depositEth',
            txid
          },
          currency: 'eth'
        });
      } catch (e) {}
    };

    WalletService.buyCFX = async (userId, total, address) => {
      try {
        await validate.async(
          { balance: { userId, total }, address },
          {
            balance: {
              presence: true,
              isBalanceEnough: true
            },
            address: {
              validAddress: true
            }
          }
        );
      } catch (e) {
        throw error(400, JSON.stringify(e), true);
      }
      const { ethBalance } = await WalletService.balance(userId);
      const user = await User.findOne({ _id: userId });
      if (address) {
        const toUserId = await WalletService.getUserIdByAddress(address);
        if (!toUserId) {
          throw error(404, 'Address not found!');
        }
      }
      total = new BigNumber(total);
      if (total.gt(ethBalance)) {
        throw error(412, 'Not enough balance!');
      }
      const ethInfo = await request(
        'https://api.coinmarketcap.com/v1/ticker/ethereum/'
      ).json;
      const senderWallet = await Wallet.find({ userId });
      const { price_usd } = ethInfo[0];
      const cfxAmount = new BigNumber(total).times(price_usd).div(1);
      const task = Fawn.Task();
      const txid = mongoose.Types.ObjectId();
      task.save(Transaction, {
        userId: address ? toUserId : userId,
        amount: cfxAmount.toString(),
        date: new Date(),
        key: `cfx:buy:${txid}:${new Date()}:${price_usd}:1`,
        data: {
          type: 'buyCFX',
          from: senderWallet.address,
          to: address ? address : senderWallet.address,
          txid,
          ethRate: price_usd
        },
        currency: 'cfx'
      });
      task.save(Transaction, {
        userId: userId,
        amount: total.neg().toString(),
        date: new Date(),
        key: `cfx:buy:${txid}:${new Date()}:${price_usd}:1`,
        data: {
          type: 'buyCFX',
          from: senderWallet.address,
          to: address ? address : senderWallet.address,
          txid,
          ethRate: price_usd
        },
        currency: 'eth'
      });
      // Neu mua ho cho chinh ref duoi minh?
      if (user.refererId) {
        task.save(Transaction, {
          userId: user.refererId,
          amount: total.times(0.07).toString(),
          date: new Date(),
          key: `cfx:referralBonus:${txid}:${new Date()}:${userId}`,
          data: {
            type: 'referralBonus',
            from: userId,
            buyAmount: total,
            txid
          },
          currency: 'cfx'
        });
      }
      return await task.run({ useMongoose: true });
    };

    WalletService.getTransactions = async userId => {
      return await Transaction.find({ userId });
    };

    WalletService.depositToAddress = async (address, amount, txid) => {
      const userId = await WalletService.getUserIdByAddress(address);
      if (!userId) {
        throw error(404, 'No wallet linked to this address');
      }
      return await WalletService.depositEth(userId, amount, txid);
    };

    return WalletService;
  }
];

module.exports = {
  require: requires,
  func
};
