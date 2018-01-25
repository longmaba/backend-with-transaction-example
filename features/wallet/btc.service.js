const [requires, func] = [
  '::blockchain.info/Receive, config',
  (Receive, config) => {
    return new Receive(
      config.bitcoin.xpub,
      `${config.apiUrl}/btc/receive`,
      config.bitcoin.key
    );
  }
];

module.exports = {
  require: requires,
  func
};
