const [requires, func] = [
  ' ::express, services.User, checkLoggedIn, ::speakeasy, checkTfa, checkAdmin, api, async-wrapper, error, jwt, md5, config',
  (
    express,
    UserService,
    checkLoggedIn,
    speakeasy,
    checkTfa,
    checkAdmin,
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
        let user;
        try {
          user = await jwt.decode(token);
        } catch (e) {
          res.redirect(`${config.webUrl}/tokenExpired`);
          return;
        }
        await UserService.activateAccount(user.id);
        res.redirect(`${config.webUrl}/activationSuccess`);
      })
    );

    router.post(
      '/resendActivationEmail',
      wrap(async (req, res, next) => {
        const { email } = req.body;
        await UserService.resendActivationEmail(email);
        res.sendStatus(200);
      })
    );

    router.post(
      '/resetPassword',
      wrap(async (req, res, next) => {
        const { email } = req.body;
        await UserService.resetPassword(email);
        res.sendStatus(200);
      })
    );

    router.get(
      '/resetPassword/:token',
      wrap(async (req, res, next) => {
        const { token } = req.params;
        let user;
        try {
          user = await jwt.decode(token);
        } catch (e) {
          res.redirect(`${config.webUrl}/tokenExpired`);
          return;
        }
        await UserService.generateNewPassword(user.id);
        res.redirect(`${config.webUrl}/resetPassword/success`);
      })
    );

    router.post(
      '/login',
      wrap(async (req, res, next) => {
        const { email, password, tfa } = req.body;
        const user = await UserService.checkCredentials(email, password);
        if (user.tfaSecret) {
          const tfaValid = await UserService.checkTfa(user._id, tfa);
          if (!tfaValid) throw error(400, '2FA token is invalid');
        }
        const token = await jwt.encode({
          id: user._id,
          password: md5(user.password)
        });
        res.send({
          token,
          id: user._id,
          email,
          referralCode: user.referralCode,
          tfaEnabled: !!user.tfaSecret
        });
      })
    );

    router.get(
      '/userInfo',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const { _id, email, referralCode, username, kycStatus } = req.user;
        res.send({
          id: _id,
          email,
          referralCode,
          username,
          tfaEnabled: !!req.user.tfaSecret,
          kycStatus
        });
      })
    );

    router.get(
      '/getDownline',
      checkLoggedIn(),
      wrap(async (req, res, next) => {
        const data = await UserService.getDownline(req.user._id);
        res.send(data);
      })
    );

    router.post(
      '/changePassword',
      checkLoggedIn(),
      checkTfa(),
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

    router.post(
      '/setKYCStatus',
      checkLoggedIn(),
      checkAdmin(),
      wrap(async (req, res, next) => {
        const { email, kycStatus } = req.body;
        await UserService.setKYCStatus(email, kycStatus);
        res.sendStatus(200);
      })
    );

    router.post(
      '/receiveKYCDataFromGoogle',
      wrap(async (req, res, next) => {
        const {
          time,
          email,
          fullName,
          address,
          nationality,
          dob,
          documentType,
          front,
          back
        } = req.body;
        await UserService.setKYCData(email, {
          time,
          email,
          fullName,
          address,
          nationality,
          dob,
          documentType,
          front,
          back
        });
        res.sendStatus(200);
      })
    );

    router.get(
      '/getKYCPendingUsers',
      checkLoggedIn(),
      checkAdmin(),
      wrap(async (req, res, next) => {
        const users = await UserService.getKYCPendingUsers();
        const kycDatas = users.map(u => u.kycData);
        res.send(kycDatas);
      })
    );

    api.use('/auth', router);
  }
];

module.exports = {
  require: requires,
  func
};
