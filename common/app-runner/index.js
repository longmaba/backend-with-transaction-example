module.exports = {
  name: 'Application runner',
  description: 'Run the express application',
  exports: ['appRunner', 'limiter'],
  services: {
    limiter: {
      require: ['api', '::redis', '::express-limiter', 'config'],
      async: true,
      func: (api, redis, expressLimiter, config) => {
        const client = require('redis').createClient(
          config.redisUrl || 'redis://localhost'
        );
        const limiter = expressLimiter(api, client);
        return limiter;
      }
    },
    appRunner: {
      require: [
        'api',
        'middlewares',
        'config',
        'app',
        'logger',
        '::chalk',
        '::figlet',
        '::bluebird'
      ],
      async: true,
      func: (api, middlewares, config, app, logger, chalk, figlet, Promise) => {
        app.use(middlewares);

        app.get('/', (req, res) => {
          res.send("API is up and running.");
        });

        app.use('/api', api);

        app.use((req, res, next) => {
          let err = new Error('Not Found');
          err.status = 404;
          next(err);
        });

        if (
          !process.env.ENVIRONMENT ||
          process.env.ENVIRONMENT === 'development'
        ) {
          app.use(function(err, req, res, next) {
            console.error(err);
            res.status(err.status || 500);
            if (err.json) {
              res.send(JSON.parse(err.message));
            } else {
              res.header('Content-Type', 'text/plain');
              res.send(`${err.message}`);
            }
          });
        }

        // production error handler
        // no stacktraces leaked to user
        app.use(function(err, req, res, next) {
          console.error(err);
          res.status(err.status || 500);
          res.send(err.message);
        });

        const deferred = Promise.pending();

        app.server.listen(process.env.PORT || config.port || 8080, () => {
          const msg = chalk.black.bgGreen(
            `Express Server started on port ${app.server.address().port}`
          );
          logger.info(
            `
${chalk.green(figlet.textSync('ServerStarted'))}
\t${msg}
`
          );
          deferred.resolve(app);
        });
        return deferred.promise;
      }
    }
  }
};
