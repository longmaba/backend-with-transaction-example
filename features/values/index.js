module.exports = {
  name: 'values',
  description: 'key value store in mongodb',
  services: {
    'models.Value': 'value.model << mongoose',
    'services.Value': require('./value.service'),
  },
  exports: ['models.Value', 'services.Value']
};
