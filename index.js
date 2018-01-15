const Container = require('flat-ioc');

const config = {
  interactive: false
};

const container = new Container(module, './plugins', config);
