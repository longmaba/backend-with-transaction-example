const [requires, func] = [
  `models.Wallet, models.Transaction, models.User, ::crypto, ::ethereumjs-util, web3, ::ethereumjs-tx,
  ::bignumber.js, error, Fawn, mongoose, ::request-promise, ::validate.js, config, services.Btc, ::blockchain.info/MyWallet, lock`,
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
    validate,
    config,
    BtcService,
    MyWallet,
    Lock
  ) => {
    WalletService = {};

    const appName = process.env.appName || config.appName;

    const btcWallet = new MyWallet(
      config.bitcoin.identifier,
      config.bitcoin.password,
      { apiCode: config.bitcoin.key, apiHost: config.bitcoin.apiHost }
    );

    validate.validators.validAddress = async address => {
      if (!address) {
        return;
      }
      const userId = await Wallet.findOne({ address });
      if (!userId) {
        return 'is not valid!';
      }
    };

    validate.validators.ethBalanceEnough = async ({ user, total }) => {
      const { ethBalance } = await WalletService.balance(user);
      total = web3.toWei(total, 'ether');
      if (total.gt(ethBalance)) {
        return 'is not enough';
      }
    };

    validate.validators.btcBalanceEnough = async ({ user, total }) => {
      const { btcBalance } = await WalletService.balance(user);
      if (total.gt(btcBalance)) {
        return 'is not enough';
      }
    };

    const generateBitcoinAddress = async () => {
      const ttl = 10000;
      const lock = await Lock.lock(`${appName}/btc/GENERATE_ADDRESS`, ttl);
      let btcAddress;
      const gap = await request(
        `https://api.blockchain.info/v2/receive/checkgap?xpub=${config.bitcoin.xpub}&key=${config.bitcoin.key}`
      );
      console.log(gap);
      if (gap === 10) {
        lock.extend(ttl);
        const gapAddress = await BtcService.generate().address;
        btcWallet.send(gapAddress, 1000);
      }
      btcAddress = await BtcService.generate().address;
      await lock.unlock();
      return btcAddress;
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
      // const btcAddress = await generateBitcoinAddress();
      return await Wallet.create({
        userId: id,
        address: `0x${address.toString('hex')}`,
        privateKey: randbytes
        // btcAddress: btcAddress
      });
    };

    // TODO: Lock
    WalletService.balance = async id => {
      const transactions = await Transaction.find({
        userId: id
      });
      let ethBalance = new BigNumber(0);
      let cfxBalance = new BigNumber(0);
      let btcBalance = new BigNumber(0);
      for (let transaction of transactions) {
        switch (transaction.currency) {
          case 'eth':
            ethBalance = ethBalance.plus(transaction.amount);
            break;
          case 'cfx':
            cfxBalance = cfxBalance.plus(transaction.amount);
            break;
          case 'btc':
            btcBalance = btcBalance.plus(transaction.amount);
            break;
          default:
            break;
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
      const gas = await estimateGas(
        fromAddress,
        config.ethMainAddress.address,
        amount
      );
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
      const gasLimit = await estimateGas(fromAddress, toAddress, amount);
      const txParams = {
        nonce: `0x${count.toString(16)}`,
        gasPrice: `0x${new BigNumber(gasPrice).toString(16)}`,
        gasLimit: `0x${new BigNumber(gasLimit).toString(16)}`,
        to: toAddress,
        value: `0x${amount.toString(16)}`
      };
      const tx = new EthereumTx(txParams);
      tx.sign(fromPrivate);
      const serializedTx = tx.serialize();
      return await sendRawTransaction(serializedTx);
    };

    const sendRawTransaction = tx =>
      new Promise((resolve, reject) => {
        web3.eth.sendRawTransaction('0x' + tx.toString('hex'), (err, hash) => {
          if (err) {
            return reject(err);
          }
          resolve(hash);
        });
      });

    const getGasPrice = () =>
      new Promise((resolve, reject) => {
        web3.eth.getGasPrice((err, price) => {
          if (err) {
            reject(err);
          } else {
            resolve(price);
          }
        });
      });

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

    WalletService.findAccountByBtcAddress = async address => {
      const wallet = await Wallet.findOne({
        btcAddress: address
      });
      return wallet;
    };

    WalletService.depositBtcToAddress = async (address, amount, txid) => {
      const wallet = await WalletService.findAccountByBtcAddress(address);
      if (!wallet) {
        throw new Error('No account linked to this address');
      }
      return await WalletService.depositBtc(wallet.userId, amount, txid);
    };

    WalletService.depositBtc = async (account, amount, txid) => {
      try {
        return await Transaction.create({
          userId: account,
          amount,
          date: new Date(),
          key: `btc:deposit:${txid}`,
          data: {
            type: 'depositBtc',
            txid
          },
          currency: 'btc'
        });
      } catch (e) {}
    };

    const estimateGas = (from, to, amount) =>
      new Promise((resolve, reject) => {
        web3.eth.estimateGas(
          { from, to, value: `0x${amount.toString(16)}` },
          (err, gas) => {
            if (err) {
              reject(err);
            } else {
              resolve(gas);
            }
          }
        );
      });

    WalletService.getUserByAddress = async address => {
      const id = await WalletService.getUserIdByAddress(address);
      return await User.findById(id);
    };

    const getCryptoPriceInUsd = async currency => {
      const priceData = await request(
        `https://api.coinmarketcap.com/v1/ticker/${currency}/`
      ).json();
      return priceData[0].price_usd;
    };

    WalletService.buyCFX = async (user, total, address, currency) => {
      const senderId = user._id;
      const senderAddress = (await Wallet.findOne({ userId: senderId }))
        .address;
      let receiver = user;
      let cryptoAmount;
      if (address) {
        receiver = await WalletService.getUserByAddress(address);
      } else {
        address = senderAddress;
      }
      let price_usd = await getCryptoPriceInUsd('ethereum');
      cryptoAmount = web3.toWei(total, 'ether').neg().toString();

      let cfxAmount = new BigNumber(total).times(config.cfxPrice);

      let totalInUsd = total.times(price_usd);
      if (totalInUsd.gte(2000)) {
        cfxAmount = cfxAmount.times(1.03);
      } else if (totalInUsd.gte(5000)) {
        cfxAmount = cfxAmount.times(1.05);
      } else if (totalInUsd.gte(10000)) {
        cfxAmount = cfxAmount.times(1.07);
      }

      const task = Fawn.Task();
      const txid = mongoose.Types.ObjectId();
      task.save(Transaction, {
        userId: receiver._id,
        amount: cfxAmount.toFixed(8),
        date: new Date(),
        key: `cfx:buy:${txid}:${Date.now()}:${price_usd}:${config.cfxPrice}`,
        data: {
          type: 'buyCFX',
          from: senderAddress,
          to: address,
          txid,
          ethRate: price_usd,
          cfxPrice: config.cfxPrice
        },
        currency: 'cfx'
      });
      task.save(Transaction, {
        userId: senderId,
        amount: cryptoAmount,
        date: new Date(),
        key: `${currency}:buy:${txid}:${Date.now()}:${price_usd}:${config.cfxPrice}`,
        data: {
          type: 'buyCFX',
          from: senderAddress,
          to: address,
          txid,
          ethRate: price_usd,
          cfxPrice: config.cfxPrice
        },
        currency
      });
      if (receiver.parentId) {
        task.save(Transaction, {
          userId: receiver.parentId,
          amount: new BigNumber(cfxAmount).times(0.07).toString(),
          date: new Date(),
          key: `cfx:referralBonus:${txid}:${Date.now()}:${address}`,
          data: {
            type: 'referralBonus',
            from: address,
            buyAmount: cfxAmount,
            txid
          },
          currency: 'cfx'
        });
      }
      return await task.run({ useMongoose: true });
    };

    // WalletService.buyCFX = async (user, total, address, currency) => {
    //   const senderId = user._id;
    //   const senderAddress = (await Wallet.findOne({ userId: senderId }))
    //     .address;
    //   let receiver = user;
    //   let cryptoAmount;
    //   let price_usd;
    //   if (address) {
    //     receiver = await WalletService.getUserByAddress(address);
    //   } else {
    //     address = senderAddress;
    //   }
    //   if (currency === 'eth') {
    //     cryptoAmount = web3.toWei(total, 'ether').neg().toString();
    //     price_usd = await getCryptoPriceInUsd('ethereum');
    //   } else if (currency === 'btc') {
    //     cryptoAmount = new BigNumber(total).neg().toString();
    //     price_usd = await getCryptoPriceInUsd('bitcoin');
    //   }

    //   const cfxAmount = new BigNumber(total)
    //     .times(price_usd)
    //     .div(config.cfxPrice)
    //     .toFixed(8);

    //   const task = Fawn.Task();
    //   const txid = mongoose.Types.ObjectId();
    //   task.save(Transaction, {
    //     userId: receiver._id,
    //     amount: cfxAmount.toString(),
    //     date: new Date(),
    //     key: `cfx:buy:${txid}:${Date.now()}:${price_usd}:${config.cfxPrice}`,
    //     data: {
    //       type: 'buyCFX',
    //       from: senderAddress,
    //       to: address,
    //       txid,
    //       ethRate: price_usd,
    //       cfxPrice: config.cfxPrice
    //     },
    //     currency: 'cfx'
    //   });
    //   task.save(Transaction, {
    //     userId: senderId,
    //     amount: cryptoAmount,
    //     date: new Date(),
    //     key: `${currency}:buy:${txid}:${Date.now()}:${price_usd}:${config.cfxPrice}`,
    //     data: {
    //       type: 'buyCFX',
    //       from: senderAddress,
    //       to: address,
    //       txid,
    //       ethRate: price_usd,
    //       cfxPrice: config.cfxPrice
    //     },
    //     currency
    //   });
    //   if (receiver.parentId) {
    //     task.save(Transaction, {
    //       userId: receiver.parentId,
    //       amount: new BigNumber(cfxAmount).times(0.07).toString(),
    //       date: new Date(),
    //       key: `cfx:referralBonus:${txid}:${Date.now()}:${address}`,
    //       data: {
    //         type: 'referralBonus',
    //         from: address,
    //         buyAmount: cfxAmount,
    //         txid
    //       },
    //       currency: 'cfx'
    //     });
    //   }
    //   return await task.run({ useMongoose: true });
    // };

    WalletService.buyCfxWithEthereum = async (user, total, address) => {
      total = new BigNumber(total);
      try {
        await validate.async(
          { total, balance: { user: user._id, total }, address },
          {
            total: {
              presence: true
            },
            balance: {
              ethBalanceEnough: true
            },
            address: {
              validAddress: true
            }
          }
        );
      } catch (e) {
        throw error(400, JSON.stringify(e), true);
      }
      return await WalletService.buyCFX(user, total, address, 'eth');
    };

    WalletService.buyCfxWithBitcoin = async (user, total, address) => {
      total = new BigNumber(total);
      try {
        await validate.async(
          { total, balance: { user: user._id, total }, address },
          {
            total: {
              presence: true
            },
            balance: {
              btcBalanceEnough: true
            },
            address: {
              validAddress: true
            }
          }
        );
      } catch (e) {
        throw error(400, JSON.stringify(e), true);
      }
      return await WalletService.buyCFX(user, total, address, 'btc');
    };

    WalletService.getTransactions = async userId => {
      return await Transaction.find({ userId }).sort({ date: -1 });
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
