import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { MAIL_USERNAME, MAIL_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  secure: true,
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
});

const sendConfirmationEmail = (email, registerToken) => {
  const mailOptions = {
    from: MAIL_USERNAME,
    to: email,
    subject: 'Activate your Streamply account',
    html: `
      <div style="text-align: center;">
        <h2>Thank you for signing up to Streamply!</h2>
        <img src="cid:logo" alt="Streamply Logo" style="max-width: 100%;" />
        <p>Click this link to confirm account creation:</p>
        <a href="http://localhost:3000/confirm-register?token=${registerToken}">Confirm Registration</a>
      </div>`,
    attachments: [
      {
        filename: 'logo-text.png',
        path: './images/logo/logo-text.png',
        cid: 'logo',
      },
    ],
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent to: ' + info.response);
    }
  });
};

export { sendConfirmationEmail };
