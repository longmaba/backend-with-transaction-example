const [requires, func] = [
  '::request-promise, ::bignumber.js, config',
  (request, BigNumber, config) => {
    const PriceService = {};

    PriceService.getCurrentPrices = async () => {
      const ethInfo = await request(
        'https://api.coinmarketcap.com/v1/ticker/ethereum/'
      ).json();
      let { price_usd } = ethInfo[0];
      const ethToUsd = price_usd;
      const ethRate = new BigNumber(config.cfxPrice).div(price_usd).toFixed(8);
      const bitcoinInfo = await request(
        'https://api.coinmarketcap.com/v1/ticker/bitcoin/'
      ).json();
      const btcToUsd = bitcoinInfo[0].price_usd;
      const btcRate = new BigNumber(config.cfxPrice).div(btcToUsd).toFixed(8);
      return {
        ethRate,
        cfxPrice: config.cfxPrice,
        btcRate,
        btcToUsd,
        ethToUsd
      };
    };

    return PriceService;
  }
];

module.exports = {
  require: requires,
  func
};
