const LATEST_PROCESSED_BLOCK = 'cfx/eth/LATEST_PROCESSED_BLOCK';

const [requires, func] = [
  'services.Wallet, services.Value, models.Transaction, queue, web3, config, lock, ::bignumber.js, ::throat, ::cron',
  (
    WalletService,
    ValueService,
    Transaction,
    queue,
    web3,
    config,
    Lock,
    BigNumber,
    throat,
    { CronJob }
  ) => {
    // web3.eth.filter('latest').watch((err, result) => {
    //   if (err) {
    //     return;
    //   }
    //   web3.eth.getBlock(result, (err, block) => {
    //     if (err) {
    //       return;
    //     }
    //     queue.create('cfx:ethTxs', { transactions: block.transactions }).save();
    //   });
    // });

    const appName = process.env.appName || config.appName;

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
      let account;
      console.log(address);
      try {
        account = await WalletService.getUserIdByAddress(address);
      } catch (e) {}
      if (!account) {
        return;
      }
      console.log(confirmations);
      if (confirmations < 6) {
        queue
          .create(`${appName}:eth`, { tx })
          .delay(config.worker.retryDelay)
          .save();
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
            console.log(tx);
            const transaction = await getTransaction(tx);
            if (!transaction) {
              return;
            }
            const address = transaction.to;
            let account;
            try {
              account = await WalletService.getUserIdByAddress(address);
            } catch (e) {}
            if (account) {
              queue.create(`${appName}:eth`, { tx }).save();
            }
          })
        )
      );
      return true;
    };

    const getBlock = blockNumber =>
      new Promise((resolve, reject) => {
        web3.eth.getBlock(blockNumber, (err, block) => {
          if (err) {
            reject(err);
          } else {
            resolve(block);
          }
        });
      });

    const processBlock = async () => {
      try {
        const ttl = 10000;
        const lock = await Lock.lock(`${appName}/eth/CHECK_BLOCK`, ttl);
        const blockNumber = web3.eth.blockNumber;
        let latestProcessedBlock = await ValueService.get(
          LATEST_PROCESSED_BLOCK
        );
        console.log('Current Block Number:', blockNumber);
        if (!latestProcessedBlock) {
          await ValueService.set(LATEST_PROCESSED_BLOCK, blockNumber);
          const block = await getBlock(blockNumber);
          if (!block) {
            return;
          }
          console.log(
            `Processing new block number: ${blockNumber} - ${block.transactions.length} transactions`
          );
          queue
            .create(`${appName}:ethTxs`, { transactions: block.transactions })
            .save();
        } else {
          while (latestProcessedBlock < blockNumber) {
            lock.extend(ttl);
            latestProcessedBlock++;
            await ValueService.set(
              LATEST_PROCESSED_BLOCK,
              latestProcessedBlock
            );
            const block = await getBlock(latestProcessedBlock);
            if (!block) {
              // TODO: put failed block to queue and retry in the future
              console.log(`Failed to get block ${latestProcessedBlock}`);
              continue;
            }
            console.log(
              `Processing new block number: ${latestProcessedBlock} - ${block.transactions.length} transactions`
            );
            queue
              .create(`${appName}:ethTxs`, { transactions: block.transactions })
              .save();
          }
        }
        await lock.unlock();
      } catch (err) {
        console.error(err);
      }
    };

    queue.process(`${appName}:ethRetry`, async (job, done) => {
      try {
        const tx = job.data.tx;
        await processTransaction(tx);
        done();
      } catch (e) {
        console.error(e);
        done(e);
      }
    });

    queue.process(`${appName}:eth`, async (job, done) => {
      try {
        const tx = job.data.tx;
        await processTransaction(tx);
        done();
      } catch (e) {
        console.error(e);
        done(e);
      }
    });

    queue.process(`${appName}:ethTxs`, async (job, done) => {
      try {
        const transactions = job.data.transactions;
        await processTransactions(transactions);
        done();
      } catch (e) {
        console.error(e);
        done(e);
      }
    });

    const initCron = () => {
      new CronJob(
        '*/10 * * * * *',
        async () => {
          await processBlock();
        },
        null,
        true
      );
    };

    initCron();

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
