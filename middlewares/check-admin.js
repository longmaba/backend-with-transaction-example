module.exports = () => () => async (req, res, next) => {
  if (!req.profile.isAdmin) {
    let err = new Error('You must be admin to do this!');
    err.status = 403;
    next(err);
  } else {
    next();
  }
};
