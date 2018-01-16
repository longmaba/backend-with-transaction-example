const [requires, func] = [
  'services.Wallet, models.Transaction, queue, web3, config, ::bignumber.js, ::throat',
  (WalletService, Transaction, queue, web3, config, BigNumber, throat) => {
    web3.eth.filter('latest').watch((err, result) => {
      web3.eth.getBlock(result, (err, block) => {
        queue.create('ethTxs', { transactions: block.transactions }).save();
      });
    });

    const getTransaction = tx =>
      new Promise((resolve, reject) => {
        web3.eth.getTransaction(tx, (err, transaction) => {
          if (err) {
            reject(err);
          } else {
            resolve(transaction);
          }
        });
      });

    const processTransaction = async tx => {
      const blockNumber = web3.eth.blockNumber;
      const transaction = await getTransaction(tx);
      const confirmations = blockNumber - transaction.blockNumber;
      const address = transaction.to;
      const account = await WalletService.getUserByAddress(address);
      if (!account) {
        return;
      }
      if (confirmations < 6) {
        queue.create('eth', { tx }).delay(config.worker.retryDelay).save();
      } else {
        await WalletService.transferToMain(transaction.to, transaction.value);
        await WalletService.depositToAddress(
          transaction.to,
          transaction.value,
          tx
        );
      }
    };

    const processTransactions = async transactions => {
      await Promise.all(
        transactions.map(
          throat(50, async tx => {
            const transaction = await getTransaction(tx);
            const address = transaction.to;
            const account = await WalletService.getUserByAddress(address);
            if (account) {
              queue.create('eth', { tx }).save();
            }
          })
        )
      );
      return true;
    };

    queue.process('ethRetry', async (job, done) => {
      try {
        const tx = job.data.tx;
        await processTransaction(tx);
        done();
      } catch (e) {
        console.error(e);
        done(e);
      }
    });

    queue.process('eth', async (job, done) => {
      try {
        const tx = job.data.tx;
        await processTransaction(tx);
        done();
      } catch (e) {
        console.error(e);
        done(e);
      }
    });

    queue.process('ethTxs', async (job, done) => {
      try {
        const transactions = job.data.transactions;
        await processTransactions(transactions);
        done();
      } catch (e) {
        console.error(e);
        done(e);
      }
    });

    // queue.process('ethWithdraw', async (job, done) => {
    //   try {
    //     const { tx, address } = job.data;
    //     const transaction = await CryptoTransaction.findOne({ _id: tx._id });
    //     const txId = await WalletService.transferFromMain(
    //       address,
    //       new BigNumber(tx.amount).neg().sub('1e15')
    //     );
    //     transaction.key = `eth:withdraw:${txId}`;
    //     await transaction.save();
    //     done();
    //   } catch (e) {
    //     console.error(e);
    //     done(e);
    //   }
    // });
  }
];

module.exports = {
  require: requires,
  func
};
