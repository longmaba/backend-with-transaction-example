module.exports = [
  './common/system',

  // common
  './common/connect-db',
  './common/libs',
  './common/routes',
  './common/mail',
  './common/sms',
  './common/image',
  './common/push-notification',
  './common/queue',
  './common/crypto-utils',
  './common/lock',

  // features
  './features/auth',
  './features/wallet',
  './features/price',
  './features/values',
  './features/admin',

  // middlewares
  './middlewares/',

  // App runner
  './common/app-runner'
];
