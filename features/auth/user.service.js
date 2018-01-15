const [requires, func] = [
  'models.User, error, ::validate.js, ::generate-password, jwt, email.sendActivation, md5',
  (User, error, validate, generator, jwt, sendActivationEmail, md5) => {
    const UserService = {};

    validate.validators.uniqueEmail = async email => {
      const user = await User.findOne({ email });
      if (user) {
        return 'is not available!';
      }
    };

    validate.validators.uniqueUsername = async username => {
      const user = await User.findOne({ username });
      if (user) {
        return 'is not available!';
      }
    };

    validate.validators.validReferralCode = async referralCode => {
      if (!referralCode) {
        return;
      }
      const user = await User.findOne({ referralCode });
      if (!user) {
        return 'is not valid!';
      }
    };

    UserService.createNew = async (email, password, username, referralCode) => {
      try {
        await validate.async(
          { email, password, username, referralCode },
          {
            email: {
              email: true,
              presence: true,
              uniqueEmail: true
            },
            password: {
              presence: true,
              length: { minimum: 7, maximum: 100 }
            },
            username: {
              presence: true,
              uniqueUsername: true,
              length: { minimum: 3, maximum: 20 }
            },
            referralCode: {
              validReferralCode: true
            }
          }
        );
      } catch (e) {
        throw error(400, JSON.stringify(e), true);
      }
      let referrer;
      if (referralCode) {
        referrer = await User.findOne({ referralCode });
      }
      const ownReferralCode = generator.generate({
        length: 10
      });
      const user = await User.create({
        email,
        password,
        username,
        referrerId: referrer && referrer._id,
        referralCode: ownReferralCode,
        isActivated: false
      });
      const validationCode = await jwt.encode({ id: user._id }, '1h');
      sendActivationEmail(email, validationCode);
      return user;
    };

    UserService.activateAccount = async id => {
      const user = await User.findOne({ _id: id });
      if (!user) {
        throw error(404, 'User does not exist!');
      }
      user.isActivated = true;
      await user.save();
      return user;
    };

    UserService.checkPassword = async (id, password) => {
      const user = await User.findById(id);
      if (!user) {
        throw error(404, 'User does not exist!');
      }
      if (md5(user.password) !== password) {
        throw error(401, 'Password is not valid!');
      }
      return user;
    };

    UserService.checkCredentials = async (email, password) => {
      const user = await User.findOne({ email, password });
      if (!user) {
        throw error(401, 'Invalid email or password!');
      }
      return user;
    };

    UserService.getUserInfo = async id => {
      const user = await User.findById(id);
      if (!user) {
        throw error(404, 'User does not exist!');
      }
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        referralCode: user.referralCode,
        referrerId: user.referrerId
      };
    };

    return UserService;
  }
];

module.exports = {
  require: requires,
  func
};
