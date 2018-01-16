const [requires, func] = [
  ' ::express, services.User, checkLoggedIn, api, async-wrapper, error, jwt, md5, config',
  (express, UserService, checkLoggedIn, api, wrap, error, jwt, md5, config) => {
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
        res.redirect(`${config.webUrl}/activationSuccess`);
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
        res.send({ token, id: user._id, email });
      })
    );

    router.get(
      '/userInfo',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { _id, email, referralCode, username } = req.user;
        res.send({
          id: _id,
          email,
          referralCode,
          username
        });
      })
    );

    api.use('/auth', router);
  }
];

module.exports = {
  require: requires,
  func
};
