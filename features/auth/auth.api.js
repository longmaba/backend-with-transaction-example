const [requires, func] = [
  ' ::express, services.User, checkLoggedIn, ::speakeasy, checkTfa, api, async-wrapper, error, jwt, md5, config',
  (
    express,
    UserService,
    checkLoggedIn,
    speakeasy,
    checkTfa,
    api,
    wrap,
    error,
    jwt,
    md5,
    config
  ) => {
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
        res.send({
          token,
          id: user._id,
          email,
          referralCode: user.referralCode,
          tfaEnabled: user
        });
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
          username,
          tfaEnabled: !!req.user.tfaSecret
        });
      })
    );

    router.get(
      '/getDownline',
      wrap(async (req, res, next) => {
        const data = await UserService.getDownline(req.user._id);
        let results = {};
        for (let key in data) {
          data[key].map(d => {
            results[key] = results[key]
              ? [...results[key], { ...d.toObject(), password: undefined }]
              : [{ ...d.toObject(), password: undefined }];
          });
        }
        res.send(results);
      })
    );

    router.post(
      '/changePassword',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;
        await UserService.changePassword(
          req.user._id,
          oldPassword,
          newPassword
        );
        res.sendStatus(200);
      })
    );

    router.post(
      '/enableTwoFactor',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        if (req.user.tfaSecret) {
          throw error(400, 'Already generated!');
        }
        const { base32, token } = req.body;
        console.log(base32, token);
        const valid = speakeasy.totp.verify({
          secret: base32,
          encoding: 'base32',
          token
        });
        if (!valid) {
          throw error(400, 'Invalid token!');
        }
        req.user.tfaSecret = base32;
        await req.user.save();
        res.sendStatus(200);
      })
    );

    router.post(
      '/disableTwoFactor',
      checkLoggedIn(),
      checkTfa(),
      wrap(async (req, res, next) => {
        req.user.tfaSecret = null;
        await req.user.save();
        res.sendStatus(200);
      })
    );

    api.use('/auth', router);
  }
];

module.exports = {
  require: requires,
  func
};
