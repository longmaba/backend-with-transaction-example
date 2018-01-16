const [requires, func] = [
  '::express, services.Price, checkLoggedIn, api, async-wrapper, error',
  (express, PriceService, checkLoggedIn, api, wrap, error) => {
    let router = express.Router();

    router.get(
      '/currentPrice',
      wrap(async (req, res, next) => {
        res.send(await PriceService.getCurrentPrices());
      })
    );

    api.use('/price', router);
  }
];

module.exports = {
  require: requires,
  func
};
