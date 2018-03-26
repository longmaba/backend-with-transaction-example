module.exports = {
  name: 'lock',
  description: 'Create lock',
  services: {
    lock: {
      require: '::redlock, ::redis, config',
      func: (Redlock, redis, config) => {
        const client = redis.createClient(config.redisUrl || 'redis://localhost');
        const redlock = new Redlock(
          [client],
          {
            driftFactor: 0.01,
            retryCount: 0,
            retryDelay: 100,
          },
        );

        redlock.on('clientError', (err) => {
          console.log(err);
        });

        return redlock;
      },
    },
  },
  exports: ['lock'] // Models, please wait!
};
