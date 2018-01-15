module.exports = {
  name: 'sms',
  description: 'SMS service',
  services: {
    sms: {
      require: ['::twilio', 'config'],
      func: (twilio, config) => {
        const client = new twilio.RestClient(
          config.twilio.sid,
          config.twilio.token
        );
        return client;
      }
    },
    'sms.sendOTP': {
      require: ['sms', '::bluebird', 'config'],
      func: (sms, Promise, config) =>
        (to, otp) => {
          const sendSms = Promise.promisify(sms.messages.create, sms.messages);
          return sendSms({
            body: `Use this code to login: ${otp}`,
            to,
            from: config.twilio.number
          });
        }
    }
  },
  exports: ['sms', 'sms.sendOTP']
};
