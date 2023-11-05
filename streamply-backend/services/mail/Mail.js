import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { MAIL_USERNAME, MAIL_PASSWORD, OAUTH_CLIENTID, OAUTH_CLIENT_SECRET, OAUTH_REFRESH_TOKEN } =
	process.env;

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		type: "OAuth2",
		user: MAIL_USERNAME,
		pass: MAIL_PASSWORD,
		clientId: OAUTH_CLIENTID,
		clientSecret: OAUTH_CLIENT_SECRET,
		refreshToken: OAUTH_REFRESH_TOKEN,
	},
});

const sendConfirmationEmail = (email, registerToken) => {
	const mailOptions = {
		from: MAIL_USERNAME,
		to: email,
		subject: "Confirm your account in Nettube",
		text: `Click this link to confirm account creation: http://localhost:3000/confirm-register?token=${registerToken}`,
	};
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
		} else {
			console.log("Email sent to: " + info.response);
		}
	});
};

export { sendConfirmationEmail };
