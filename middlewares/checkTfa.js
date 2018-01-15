module.exports = speakeasy => () => async (req, res, next) => {
  const secret = req.user.tfaSecret;
  if (!secret) {
    next();
  } else {
    let token = req.headers['tfa-token'];
    if (!token) {
      next(new Error('TFA Token is not provided!'));
    } else {
      token = token.replace(/ /g, '');
      const validToken = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
      });
      if (validToken) {
        next();
      } else {
        next(new Error('TFA Token is not valid!'));
      }
    }
  }
};
