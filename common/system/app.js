module.exports = (
  http,
  https,
  express,
  cors,
  expressWinston,
  bodyParser,
  config,
  logger,
  fs
) => {
  let app = express();
  app.server = http.createServer(app);

  // logger
  if (process.env.NODE_ENV != 'test') {
    app.use(
      expressWinston.logger({
        winstonInstance: logger,
        expressFormat: true,
        meta: false
      })
    );
  }

  // 3rd party middleware
  app.use(
    cors({
      exposedHeaders: config.corsHeaders
    })
  );

  app.use(
    bodyParser.json({
      limit: config.bodyLimit
    })
  );
  app.use(bodyParser.text());

  return app;
};
