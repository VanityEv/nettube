import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "nettube756@gmail.com",
		pass: "zaq1@WSX",
	},
});

const sendConfirmationEmail = (email) => {
	const mailOptions = {
		from: "nettube756@gmail.com",
		to: email,
		subject: "test email",
		text: "es mail",
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
