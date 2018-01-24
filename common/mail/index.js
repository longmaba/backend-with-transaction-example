module.exports = {
  name: 'mail',
  description: 'Email service',
  services: {
    email: {
      require: ['::nodemailer', '::bluebird', 'config'],
      func: (email, Promise, config) => {
        const transporter = email.createTransport(config.smtp);
        return Promise.promisifyAll(transporter);
      }
    },
    'email.sendOTP': {
      require: ['email'],
      func: email => (to, otp) => {
        return email.sendMail({
          text: `Use this code to login: ${otp}`,
          from: 'Dike <login@dike.bet>',
          to,
          subject: '[Dike] One-time Passcode to Login',
          html: `<div style="background-color:#F3F3F3"><div style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px; background-color: #032F5B; border-radius: 4px; font-family:Verdana, sans-serif">
<img src="https://dike.bet/assets/img/dike_logo.png" height="30px" style="margin-bottom: 10px" />
<div style="background: white; box-sizing: border-box; border-radius: 4px; padding: 10px; font-size: medium">
<div>Hi there,</div>
<div>&nbsp;</div>
<div>Your one time password is:</div>
<div>&nbsp;</div>
<div><strong style="font-size: x-large; background-color: #bf913b; padding: 10px; color: white;">${otp}</strong></div>
<div>&nbsp;</div>
Good luck and have fun!</div>
<div>&nbsp;</div>
<div style="text-align: center; color: white;">Powered by <strong>Dike</strong></div>
</div></div>`
        });
      }
    },
    'email.sendActivation': {
      require: ['email', 'config'],
      func: (email, config) => (to, activationCode) => {
        return email.sendMail({
          text: `Activate your email: ${config.apiUrl}/auth/activate/${activationCode}`,
          from: 'Dike <login@dike.bet>',
          to,
          subject: 'CFX - Account activation'
        });
      }
    },
    'email.sendResetPassword': {
      require: ['email', 'config'],
      func: (email, config) => (to, activationCode) => {
        return email.sendMail({
          text: `Click on this link to reset your password: ${config.apiUrl}/auth/resetPassword/${activationCode}`,
          from: 'Dike <login@dike.bet>',
          to,
          subject: 'CFX - Reset Password'
        });
      }
    },
    'email.sendNewPassword': {
      require: ['email', 'config'],
      func: (email, config) => (to, password) => {
        return email.sendMail({
          text: `Your new password is: ${password}. Please change it as soon as possible.`,
          from: 'Dike <login@dike.bet>',
          to,
          subject: 'CFX - New Password'
        });
      }
    }
  },
  exports: [
    'email',
    'email.sendOTP',
    'email.sendActivation',
    'email.sendResetPassword',
    'email.sendNewPassword'
  ]
};
