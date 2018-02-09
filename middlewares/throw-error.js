module.exports = () => (message, status) => async (req, res, next) => {
  let err = new Error(message);
  err.status = status;
  next(err);
};
