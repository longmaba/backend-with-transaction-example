const [requires, func] = [
  '::request-promise, ::bignumber.js',
  (request, BigNumber) => {
    const PriceService = {};

    PriceService.getCurrentPrices = async () => {
      const ethInfo = await request(
        'https://api.coinmarketcap.com/v1/ticker/ethereum/'
      ).json();
      const { price_usd } = ethInfo[0];
      const ethRate = new BigNumber(1).div(price_usd).toFixed(8);
      return { ethRate, cfxPrice: 1 };
    };

    return PriceService;
  }
];

module.exports = {
  require: requires,
  func
};
