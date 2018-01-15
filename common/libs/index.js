module.exports = {
  name: 'libs',
  description: 'Common libraries',
  services: {
    md5: {
      require: '::crypto',
      func: crypto => data =>
        crypto.createHash('md5').update(data).digest('hex')
    },
    error: {
      func: () => (status, message, json) => {
        const error = new Error(message);
        error.status = status;
        error.json = json;
        return error;
      }
    },
    roundToMinutes: {
      func: () => (date, minutes) => {
        const coeff = minutes * 1000 * 60;
        const rounded = new Date(Math.floor(date.getTime() / coeff) * coeff);
        return rounded;
      }
    },
    'async-wrapper': 'async-wrapper',
    // 'test-error': {
    //   func: () => {
    //     throw new Error('intentional');
    //   }
    // },
    otp: 'otp',
    random: {
      require: ['::random-org', 'config'],
      func: (RandomOrg, config) =>
        new RandomOrg({ apiKey: config.randomOrg.apiKey })
    },
    jwt: 'jwt << ::jsonwebtoken, config, ::bluebird',
    fs: {
      require: ['::fs', '::bluebird'],
      func: (fs, Promise) => Promise.promisifyAll(fs)
    },
    'handlebars-switch-case': {
      require: ['::handlebars'],
      func: handlebars => {
        handlebars.registerHelper('switch', function(value, options) {
          this._switch_value_ = value;
          var html = options.fn(this); // Process the body of the switch block
          delete this._switch_value_;
          return html;
        });

        handlebars.registerHelper('case', function() {
          // Convert "arguments" to a real array - stackoverflow.com/a/4775938
          var args = Array.prototype.slice.call(arguments);

          var options = args.pop();
          var caseValues = args;

          if (caseValues.indexOf(this._switch_value_) === -1) {
            return '';
          } else {
            return options.fn(this);
          }
        });
      }
    },
    handlebars: {
      require: ['::handlebars', 'fs', '::path'],
      func: (handlebars, fs, path) => async (dir, filePath, data) => {
        const resolvedPath = path.resolve(dir, filePath);
        const template = await fs.readFileAsync(resolvedPath, 'utf-8');
        // TODO: caching template?
        return handlebars.compile(template)(data);
      }
    }
  },
  exports: [
    'md5',
    'async-wrapper',
    'otp',
    'jwt',
    'fs',
    'handlebars',
    'random',
    'error',
    'roundToMinutes'
  ]
};
