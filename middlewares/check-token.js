module.exports = (jwt, middlewares, ProfileService) => {
  middlewares.use(async (req, res, next) => {
    try {
      let token = req.header('x-access-token');
      if (!token) {
        return next();
      }
      let data = await jwt.decode(token);
      if (!data) {
        return next();
      }
      let profile = await ProfileService.checkPassword(data.id, data.password);
      if (profile) {
        req.profile = profile;
      }
      next();
    } catch (e) {
      next();
    }
  });
};
