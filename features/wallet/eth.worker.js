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
      try {
        account = await WalletService.getUserIdByAddress(address);
      } catch (e) {}
      if (!account) {
        return;
      }
      if (confirmations < 6) {
        queue
          .create(`${appName}:eth`, { tx })
          .delay(config.worker.retryDelay)
          .save();
      } else {
        try {
          await WalletService.depositToAddress(
            transaction.to,
            transaction.value,
            tx
          );
        } catch (e) {
          console.log('Deposit tx already recorded!');
        }
        try {
          await WalletService.transferToMain(transaction.to, transaction.value);
        } catch (e) {
          console.log('Cannot transfer to main');
          console.error(e);
        }
      }
    };

    const processTransactions = async transactions => {
      await Promise.all(
        transactions.map(
          throat(50, async tx => {
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

        try {
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
            while (latestProcessedBlock < blockNumber - 3) {
              lock.extend(ttl);
              latestProcessedBlock++;
              await ValueService.set(
                LATEST_PROCESSED_BLOCK,
                latestProcessedBlock
              );
              const block = await getBlock(latestProcessedBlock);
              if (!block) {
                console.log(
                  `Failed to get block ${latestProcessedBlock}. Retry in ${config.worker.retryDelay}`
                );
                queue
                  .create(`${appName}:ethBlockRetry`, {
                    blockNumber: latestProcessedBlock,
                    count: 0
                  })
                  .delay(config.worker.retryDelay)
                  .save();
                continue;
              }
              console.log(
                `Processing new block number: ${latestProcessedBlock} - ${block.transactions.length} transactions`
              );
              queue
                .create(`${appName}:ethTxs`, {
                  transactions: block.transactions
                })
                .save();
            }
          }
        } catch (err) {
          console.error(err);
        }
        await lock.unlock();
      } catch (e) {
        console.error(e);
      }
    };

    queue.process(`${appName}:ethBlockRetry`, async (job, done) => {
      const { blockNumber, count } = job.data;
      const block = await getBlock(blockNumber);
      console.log(
        `Retry fetching block ${blockNumber}. Attempt number#${count + 1}`
      );
      if (!block && count < 3) {
        console.log(
          `Failed to get block ${blockNumber} after retry attempt #${count + 1}. Retry in ${config.worker.retryDelay}`
        );
        queue
          .create(`${appName}:ethBlockRetry`, {
            blockNumber: blockNumber,
            count: count + 1
          })
          .delay(config.worker.retryDelay)
          .save();
        done();
        return;
      }
      console.log(
        `Retry block: ${blockNumber} succeeded - ${block.transactions.length} transactions`
      );
      queue
        .create(`${appName}:ethTxs`, { transactions: block.transactions })
        .save();
      done();
    });

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
