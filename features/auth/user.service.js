const [requires, func] = [
  'models.User, error, ::validate.js, ::generate-password, jwt, email.sendActivation, email.sendResetPassword, email.sendNewPassword, md5, ::speakeasy',
  (
    User,
    error,
    validate,
    generator,
    jwt,
    sendActivationEmail,
    sendResetPasswordEmail,
    sendNewPasswordEmail,
    md5,
    speakeasy
  ) => {
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

    UserService.checkTfa = async (id, tfa) => {
      const user = await User.findById(id);
      if (!user) {
        throw error(404, 'User does not exist!');
      }
      tfa = tfa.replace(/ /g, '');
      const validToken = speakeasy.totp.verify({
        secret: user.tfaSecret,
        encoding: 'base32',
        token: tfa
      });
      return validToken;
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
        parentId: referrer && referrer._id,
        referralCode: ownReferralCode,
        isActivated: false
      });
      const validationCode = await jwt.encode({ id: user._id }, '1h');
      sendActivationEmail(email, validationCode);
      return user;
    };

    UserService.resendActivationEmail = async email => {
      const user = User.findOne({ email });
      if (!user) {
        throw error(404, 'User not found!');
      }
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

    UserService.resetPassword = async email => {
      const user = await User.findOne({ email });
      if (!user) {
        throw error(404, 'Email does not exist!');
      }
      const validationCode = await jwt.encode({ id: user._id }, '1h');
      sendResetPasswordEmail(email, validationCode);
    };

    UserService.generateNewPassword = async id => {
      const user = await User.findById(id);
      if (!user) {
        throw error(404, 'User does not exist!');
      }
      const password = generator.generate({
        length: 10
      });
      user.password = password;
      await user.save();
      sendNewPasswordEmail(user.email, password);
    };

    UserService.changePassword = async (id, oldPassword, newPassword) => {
      const user = await User.findById(id);
      if (!user) {
        throw error(404, 'User does not exist!');
      }
      if (newPassword.length < 7 || newPassword.length > 100) {
        throw error(400, 'Password length should be between 7 and 100!');
      }
      if (user.password === oldPassword) {
        user.password = newPassword;
      } else {
        throw error(400, 'Incorrect password!');
      }
      await user.save();
      return user;
    };

    UserService.checkCredentials = async (email, password) => {
      const user = await User.findOne({ email, password });
      if (!user) {
        throw error(401, 'Invalid email or password!');
      } else if (!user.isActivated) {
        throw error(403, 'Account is not activated!');
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

    const levelize = (arr, limit = Infinity) => {
      const levels = {};
      const rootNode = arr.filter(i => i.lft === 1)[0];
      levels[0] = [rootNode];

      let currentLevel = 0;

      while (true) {
        const parentIds = levels[currentLevel].map(i => i._id);
        currentLevel++;
        const currentLevelList = [
          ...arr.filter(i => {
            for (let parentId of parentIds) {
              if (parentId.equals(i.parentId)) return true;
            }
            return false;
          })
        ];
        if (currentLevelList.length === 0 || currentLevel > limit) {
          break;
        } else {
          levels[currentLevel] = currentLevelList;
        }
      }
      return levels;
    };

    const makeTree = (arr, limit = Infinity) => {
      arr = arr.map(i => ({
        id: i._id,
        username: i.username,
        email: i.email,
        parentId: i.parentId,
        lft: i.lft,
        rgt: i.rgt
      }));
      const rootNode = arr.filter(i => i.lft === 1)[0];
      rootNode.depth = 0;
      const populateNode = node => {
        if (node.depth >= limit) {
          return;
        }
        const children = arr.filter(i => node.id.equals(i.parentId));
        for (let child of children) {
          child.depth = node.depth + 1;
          populateNode(child);
        }
        if (children.length > 0) {
          node.children = children;
        }
      };
      populateNode(rootNode);
      return rootNode;
    };

    UserService.getDownline = id =>
      new Promise(async (resolve, reject) => {
        const user = await User.findById(id);
        if (!user) {
          return reject(error(404, 'User does not exist!'));
        }
        User.rebuildTree(user, 1, function() {
          user.descendants(function(err, data) {
            if (err) {
              return reject(err);
            }
            resolve(makeTree([user, ...data], 5));
          });
        });
      });

    return UserService;
  }
];

module.exports = {
  require: requires,
  func
};
