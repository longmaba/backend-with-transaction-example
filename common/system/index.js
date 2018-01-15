module.exports = {
  name: 'System',
  description: 'loading config, bootstrapping stuffs...',
  services: {
    'config': {
      require: ['::./config', '::fs'],
      func: (config, fs) => {
        let ext = {};
        try {
          ext = JSON.parse(fs.readFileSync(process.env.CONFIG_EXT_PATH || '/dev/null/random-unexisted-file.json', 'utf8'));
        } catch(e) {
          console.log('Config extension not found!');
        }
        return {
          ...config,
          ...ext
        };
      }
    },
    'app': 'app << ::http, ::https, ::express, ::cors, ::express-winston, ::body-parser, config, logger, ::fs',
    'logger': {
      require: ['::winston'],
      func: (winston) => {
        if (process.env.NODE_ENV == 'test') {
          winston.remove(winston.transports.Console);
        }

        const logger = new winston.Logger({
          transports: [
            new winston.transports.Console({
              timestamp: () => new Date().toLocaleString()
            })
          ]
        });
        logger.cli();
        return logger;
      }
    }
  },
  exports: ['config', 'app', 'logger']
};