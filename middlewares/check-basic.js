module.exports = auth => (username, password) => (req, res, next) => {
  const credentials = auth(req);

  if (
    !credentials || credentials.name != username || credentials.pass != password
  ) {
    res.status(401);
    res.header('WWW-Authenticate', 'Basic realm="Enter username and password"');
    res.send('Access denied');
  } else {
    next();
  }
};
