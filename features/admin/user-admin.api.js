const [requires, func] = [
  `::express, api, async-wrapper, models.User, checkBasic, config`,
  (express, api, wrap, User, checkBasic, config) => {
    let router = express.Router();

    router.get(
      '/',
      wrap(async (req, res, next) => {
        let registrationCount = await User.count();
        let activationCount = await User.count({ isActivated: true });
        let tenLast = await User.find().limit(10).sort({
          _id: -1
        });
        res.set('Content-Type', 'text/plain');
        res.send(
          `Registrations:\t${registrationCount}\nActivated:\t${activationCount}\nLast 10 emails:\t${tenLast
            .map(u => u.email)
            .join(', ')}`
        );
      })
    );

    api.use('/admin', checkBasic(config.admin.name, config.admin.pass), router);
  }
];

module.exports = {
  require: requires,
  func
};
