//Nodemailer package (use for sending email using node.js)
const nodemailer = require('nodemailer');
const { convert } = require('html-to-text');
const plug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Yanis Ching ${process.env.EMAIL_FROM}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });

      //Example of GMAIL
      // service: 'Gmail',
      // auth: {
      //   user: process.env.EMAIL_USERNAME, (save in config file)
      //   pass: process.env.EMAIL_PASSWORD, (save in config file)
      // },
      // Activate in gmail 'less secure app' option
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      logger: true, // log all info to the console to debug
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //1) Get html from the template
    const html = plug.renderFile(
      `${__dirname}/../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    //2) Define the email options
    const mailOptions = {
      from: this.from, //email coming from
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    //3) Actually send the email with Nodemailer
    await this.newTransport().sendMail(mailOptions); //return a promise - async function without store result.
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 min)',
    );
  }
};
