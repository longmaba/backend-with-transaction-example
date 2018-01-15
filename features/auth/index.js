module.exports = {
  name: 'auth',
  description: 'Contains services and models for user, API for authentication and querying user info',
  services: {
    'models.User': 'user.model << mongoose',
    'services.User': require('./user.service'),
    'api.auth': require('./auth.api')
  },
  exports: ['models.User', 'services.User']
};
