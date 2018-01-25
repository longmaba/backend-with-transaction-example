module.exports = {
  name: 'wallet',
  description: 'Contains services and models for Transaction and Wallet, API for wallet',
  services: {
    'models.Transaction': 'transaction.model << mongoose',
    'models.Wallet': 'wallet.model << mongoose',
    'services.Wallet': require('./wallet.service'),
    'api.wallet': require('./wallet.api'),
    'workers.ETH': require('./eth.worker'),
    'services.Btc': require('./btc.service')
  },
  exports: ['models.Transaction', 'models.Wallet', 'services.Wallet']
};
