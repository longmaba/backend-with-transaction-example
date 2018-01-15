module.exports = {
  name: 'queue',
  description: 'Queue service',
  services: {
    queue: {
      require: ['::kue', 'config'],
      func: (kue, config) => {
        return kue.createQueue({
          redis: config.redisUrl || 'redis://localhost'
        });
      }
    }
  },
  exports: ['queue']
};
