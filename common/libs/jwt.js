module.exports = (jwt, config, Promise) => {
  const jwtVerify = Promise.promisify(jwt.verify, jwt);
  return {
    encode: (id, password) => {
      let deferred = Promise.pending();
      jwt.sign(
        {
          id,
          password
        },
        config.jwtSecret,
        {
          algorithm: 'HS256'
        },
        (err, token) => {
          if (err) deferred.reject(err);
          else deferred.resolve(token);
        }
      );
      return deferred.promise;
    },
    decode: token => {
      return jwtVerify(token, config.jwtSecret);
    }
  };
};
