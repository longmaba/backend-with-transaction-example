module.exports = (jwt, middlewares, UserService) => {
  middlewares.use(async (req, res, next) => {
    try {
      let token = req.header('x-access-token');
      if (!token) {
        return next();
      }
      let data = await jwt.decode(token);
      console.log(data);

      if (!data) {
        return next();
      }
      let profile = await UserService.checkPassword(data.id, data.password);
      if (profile) {
        req.user = profile;
      }
      next();
    } catch (e) {
      next();
    }
  });
};
