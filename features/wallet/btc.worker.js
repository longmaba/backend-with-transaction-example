const [requires, func] = [
  '::express, api, async-wrapper, error',
  (express, api, wrap, error) => {
    const router = express.Router();

    const handler = wrap(async (req, res, next) => {
      console.log(req.params);
      res.sendStatus(200);
    });

    router.get('/', handler);
    router.post('/', handler);

    api.use('/btc', router);
  }
];

module.exports = {
  require: requires,
  func
};
