module.exports = {
  name: 'price',
  description: 'Contains services, API for price',
  services: {
    'services.Price': require('./price.service'),
    'api.price': require('./price.api')
  },
  exports: ['services.Price']
};
