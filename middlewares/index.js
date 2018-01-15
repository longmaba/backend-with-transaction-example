module.exports = {
  name: 'middlewares',
  description: 'Middlewares',
  services: {
    checkToken: 'check-token << jwt, middlewares, services.ProfileService',
    checkLoggedIn: 'check-logged-in',
    checkBasic: 'check-basic << ::basic-auth',
    checkAdmin: 'check-admin',
    checkTfa: 'checkTfa << ::speakeasy'
  },
  exports: ['checkLoggedIn', 'checkBasic', 'checkAdmin', 'checkTfa']
};
