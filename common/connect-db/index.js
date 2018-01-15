module.exports = {
  name: 'connect-db',
  description: 'Connect to mongodb',
  services: {
    'db.init': {
      require: ['::mongoose', 'config', '::bluebird', '::fawn'],
      func: async (mongoose, config, Promise, Fawn) => {
        mongoose.Promise = Promise;
        await mongoose.connect(process.env.MONGODB_URI || config.mongodbUrl, {
          useMongoClient: true
        });
        Fawn.init(mongoose);
        const roller = Fawn.Roller();
        await roller.roll();
        return { mongoose, Fawn };
      }
    },
    mongoose: {
      require: ['db.init'],
      func: dbInit => dbInit.mongoose
    },
    Fawn: {
      require: ['db.init'],
      func: dbInit => dbInit.Fawn
    }
  },
  exports: ['mongoose', 'Fawn'] // Models, please wait!
};
