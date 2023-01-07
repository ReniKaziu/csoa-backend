require("dotenv").config();
const nodemailer = require("nodemailer");
export class Mailer {
  public transporter: any;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });
  }

  public async sendMail(emailTo: String, subject: String, bodyHtml: String) {
    let mailOptions = {
      from: '"CSOA" <' + process.env.EMAIL_USER + ">", // sender address
      to: emailTo, // list of receivers
      subject, // Subject line
      html: bodyHtml,
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  }
}
