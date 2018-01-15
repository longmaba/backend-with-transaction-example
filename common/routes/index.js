module.exports = {
  name: 'routes',
  description: 'Common routers for API and middlewares',
  services: {
    api: {
      require: ['::express'],
      func: express => {
        let api = new express.Router();
        return api;
      }
    },
    middlewares: {
      require: ['::express'],
      func: express => {
        let middlewares = new express.Router();
        return middlewares;
      }
    },
    pluginDetails: {
      require: ['api', 'checkBasic', 'config', 'context', 'handlebars'],
      func: (api, checkBasic, config, context, handlebars) => {
        api.get(
          '/plugins',
          checkBasic(config.admin.name, config.admin.pass),
          async (req, res) => {
            const html = await handlebars(__dirname, './plugins.hb', {
              ...context.getInfo()
            });
            res.send(html);
          }
        );
      }
    }
  },
  exports: ['api', 'middlewares']
};
