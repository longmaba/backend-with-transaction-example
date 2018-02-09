module.exports = {
  name: 'middlewares',
  description: 'Middlewares',
  services: {
    checkToken: 'check-token << jwt, middlewares, services.User',
    checkLoggedIn: 'check-logged-in',
    checkBasic: 'check-basic << ::basic-auth',
    checkAdmin: 'check-admin',
    checkTfa: 'checkTfa << ::speakeasy',
    throwError: 'throw-error'
  },
  exports: [
    'checkLoggedIn',
    'checkBasic',
    'checkAdmin',
    'checkTfa',
    'throwError'
  ]
};
