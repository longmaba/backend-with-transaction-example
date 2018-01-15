const [requires, func] = [
  ' ::express, services.User, checkLoggedIn, api, async-wrapper, error, jwt, md5',
  (express, UserService, checkLoggedIn, api, wrap, error, jwt, md5) => {
    let router = express.Router();

    router.post(
      '/signup',
      wrap(async (req, res, next) => {
        const { email, password, username, referralCode } = req.body;
        const user = await UserService.createNew(
          email,
          password,
          username,
          referralCode
        );
        res.send(user._id);
      })
    );

    router.get(
      '/activate/:token',
      wrap(async (req, res, next) => {
        const { token } = req.params;
        const user = await jwt.decode(token);
        await UserService.activateAccount(user.id);
        res.sendStatus(200);
      })
    );

    router.post(
      '/login',
      wrap(async (req, res, next) => {
        const { email, password } = req.body;
        const user = await UserService.checkCredentials(email, password);
        const token = await jwt.encode({
          id: user._id,
          password: md5(user.password)
        });
        res.send(token);
      })
    );

    router.get(
      '/userInfo',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        res.send(req.user);
      })
    );

    api.use('/auth', router);
  }
];

module.exports = {
  require: requires,
  func
};
