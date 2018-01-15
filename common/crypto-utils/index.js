module.exports = {
  name: 'cryptoUtils',
  description: 'Crypto utilities',
  services: {
    bitcoinClient: {
      require: ['::bitcoin-core', 'config'],
      func: (Client, config) => {
        return new Client(config.bitcoin);
      }
    },
    web3: {
      require: ['::web3', 'config'],
      func: (Web3, config) => {
        return new Web3(new Web3.providers.HttpProvider(config.parityUrl));
      }
    }
  },
  exports: ['bitcoinClient', 'web3']
};
