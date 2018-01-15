module.exports = (jwt, config, Promise) => {
  const jwtVerify = Promise.promisify(jwt.verify, jwt);
  return {
    encode: (obj, expiresIn) => {
      const deferred = Promise.pending();
      const options = {
        algorithm: 'HS256'
      };
      if (expiresIn) {
        options.expiresIn = expiresIn;
      }
      jwt.sign(obj, config.jwtSecret, options, (err, token) => {
        if (err) deferred.reject(err);
        else deferred.resolve(token);
      });
      return deferred.promise;
    },
    decode: token => {
      return jwtVerify(token, config.jwtSecret);
    }
  };
};
