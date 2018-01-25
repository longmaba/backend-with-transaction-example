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
          from: 'CoinForex Authentication <login@coinforex.io>',
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
          text: `Activate your email`,
          from: 'CoinForex Authentication <login@coinforex.io>',
          to,
          subject: 'CFX - Account activation',
          html: `<div style="background-color: #eee;">
<div style="background-color: #eee; padding: 50px 0;">
<div style="width: 600px; margin: 0 auto;">
<div style="height: 64px; background-color: #323438; padding-top: 10px; padding-bottom: 10px; padding-left: 30px"><a href="https://www.coinforex.io" target="_blank" rel="noopener" ><img style="height: 70px; display: inline-block; vertical-align: middle;" src="./CFX-key.png" alt="" /></a> <span style="margin: 0; color: #666; font-size: 18px; font-family: PingFangSC,arial; vertical-align: middle; display: inline-block; padding: 4px 0 0 5px;"><span style="font-size: 22px; color: #fff"><b>CoinForex</b></span><br /><span style="font-size: 16px">FX Blockchain Platform</span></span></div>
<div style="padding: 35px 40px; background-color: #fff; color: #535353; line-height: 26px; margin: 10px auto; font-family: PingFangSC,arial;">
<p>Hello,</p>
<p>Welcome to CoinFX! You're only one step away from being successful! Please follow the link below to activate your account:</p>
<p><a href="${config.apiUrl}/auth/activate/${activationCode}" target="_blank" rel="noopener">${config.apiUrl}/auth/activate/${activationCode}</a></p>
<p>If clicking the link doesn't work, please copy the link and paste it into your browser and hit enter.</p>
<p>CoinFX</p>
<p>This email is sent automatically.</p>
</div>
<div style="padding: 15px 0; background-color: #333333; text-align: center;">
<p style="color: #878787; font-size: 12px; margin: 7px 0 10px;">Information center: <a style="color: #878787;">admin@coinforex.io</a></p>
<div style="color: #535353; font-size: 12px;">
<p style="margin: 0;">Copyright &copy;2017-2018 <a style="color: #535353;">coinforex.io</a></p>
<div>&nbsp;</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>`
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
          subject: 'CFX - Reset Password',
          html: `<div style="background-color: #eee;">
<div style="background-color: #eee; padding: 50px 0;">
<div style="width: 600px; margin: 0 auto;">
<div style="height: 64px; background-color: #323438; padding-top: 10px; padding-bottom: 10px; padding-left: 30px"><a href="https://www.coinfx.io" target="_blank" rel="noopener" ><img style="height: 70px; display: inline-block; vertical-align: middle;" src="https://static.wixstatic.com/media/3a17d1_eec1082b1e26436987a0d1ecd4766880~mv2_d_2048_2048_s_2.png/v1/fill/w_160,h_160,al_c,usm_0.66_1.00_0.01/3a17d1_eec1082b1e26436987a0d1ecd4766880~mv2_d_2048_2048_s_2.png" alt="" /></a> <span style="margin: 0; color: #666; font-size: 18px; font-family: PingFangSC,arial; vertical-align: middle; display: inline-block; padding: 4px 0 0 5px;"><span style="font-size: 22px; color: #fff"><b>CoinForex</b></span><br /><span style="font-size: 16px">FX Blockchain Platform</span></span></div>
<div style="padding: 35px 40px; background-color: #fff; color: #535353; line-height: 26px; margin: 10px auto; font-family: PingFangSC,arial;">
<p>Hello,</p>
<p>We've just received your request to reset password. Please follow the link below:</p>
<p><a href="${config.apiUrl}/auth/resetPassword/${activationCode}" target="_blank" rel="noopener">${config.apiUrl}/auth/resetPassword/${activationCode}</a></p>
<p>If clicking the link doesn't work, please copy the link and paste it into your browser and hit enter.</p>
<p>If this request was not made by you, please ignore this.</p>
<p>CoinFX</p>
<p>This email is sent automatically.</p>
</div>
<div style="padding: 15px 0; background-color: #333333; text-align: center;">
<p style="color: #878787; font-size: 12px; margin: 7px 0 10px;">Information center: <a style="color: #878787;">admin@coinforex.io</a></p>
<div style="color: #535353; font-size: 12px;">
<p style="margin: 0;">Copyright &copy;2017-2018 <a style="color: #535353;">coinforex.io</a></p>
<div>&nbsp;</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>`
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
          subject: 'CFX - New Password',
          html: `<div style="background-color: #eee;">
<div style="background-color: #eee; padding: 50px 0;">
<div style="width: 600px; margin: 0 auto;">
<div style="height: 64px; background-color: #323438; padding-top: 10px; padding-bottom: 10px; padding-left: 30px"><a href="https://coinforex.io" target="_blank" rel="noopener" ><img style="height: 70px; display: inline-block; vertical-align: middle;" src="./CFX-key.png" alt="" /></a> <span style="margin: 0; color: #666; font-size: 18px; font-family: PingFangSC,arial; vertical-align: middle; display: inline-block; padding: 4px 0 0 5px;"><span style="font-size: 22px; color: #fff"><b>CoinForex</b></span><br /><span style="font-size: 16px">FX Blockchain Platform</span></span></div>
<div style="padding: 35px 40px; background-color: #fff; color: #535353; line-height: 26px; margin: 10px auto; font-family: PingFangSC,arial;">
<p>Hello,</p>
<p>You have successfully reset your password! Here is your new password: ${password}</p>
<p>Please change this password right after logging in.</p>
<p>CoinFX</p>
<p>This email is sent automatically.</p>
</div>
<div style="padding: 15px 0; background-color: #333333; text-align: center;">
<p style="color: #878787; font-size: 12px; margin: 7px 0 10px;">Information center: <a style="color: #878787;">support@coinforex.io</a></p>
<div style="color: #535353; font-size: 12px;">
<p style="margin: 0;">Copyright &copy;2017-2018 <a style="color: #535353;">coinforex.io</a></p>
<div>&nbsp;</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>
<div>&nbsp;</div>
</div>`
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
