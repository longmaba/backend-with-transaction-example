const [requires, func] = [
  '::request-promise, ::bignumber.js, config',
  (request, BigNumber, config) => {
    const PriceService = {};

    PriceService.getCurrentPrices = async () => {
      const ethInfo = await request(
        'https://api.coinmarketcap.com/v1/ticker/ethereum/'
      ).json();
      let { price_usd } = ethInfo[0];
      const ethRate = new BigNumber(config.cfxPrice).div(price_usd).toFixed(8);
      const bitcoinInfo = await request(
        'https://api.coinmarketcap.com/v1/ticker/bitcoin/'
      ).json();
      const btcPrice = bitcoinInfo[0].price_usd;
      const btcRate = new BigNumber(config.cfxPrice).div(btcPrice).toFixed(8);
      return { ethRate, cfxPrice: config.cfxPrice, btcRate };
    };

    return PriceService;
  }
];

module.exports = {
  require: requires,
  func
};
