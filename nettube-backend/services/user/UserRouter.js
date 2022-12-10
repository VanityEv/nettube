import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { Router } from "express"; // import router from express
import bcrypt from "bcryptjs"; // import bcrypt to hash passwords
import jwt from "jsonwebtoken"; // import jwt to sign tokens
import { isUserInDB, createUser, findOneUser } from "./User.js";
import { sendConfirmationEmail } from "../mail/Mail.js";

const UserRouter = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { SECRET = "secret" } = process.env;

// Signup route to create a new user
UserRouter.post("/signup", async (req, res) => {
	try {
		await isUserInDB(req.body.username, async (data) => {
			const isUserAlreadySigned = data[0].count > 0;
			if (!isUserAlreadySigned) {
				const hashedPassword = await bcrypt.hash(req.body.password, 10);
				const userToRegister = {
					username: req.body.username,
					fullname: req.body.fullname,
					password: hashedPassword,
					birthdate: req.body.birthdate,
					email: req.body.email,
					subscription: req.body.subscription,
				};
				await createUser({ ...userToRegister }, (status) => {
					if (status.affectedRows === 1) {
						//sendConfirmationEmail(userToRegister.email);
						res.status(200).json({ result: "SUCCESS" });
					} else {
						res.status(400).json({ error: "INTERNAL_ERROR" });
					}
				});
			} else {
				res.json({ error: "ALREADY_SIGNED" });
			}
		});
	} catch (error) {
		res.status(400).json({ error });
	}
});

// Login route to verify a user and get a token
UserRouter.post("/login", async (req, res) => {
	try {
		// check if the user exists
		await findOneUser(req.body.username, async (user) => {
			const userToLogin = user[0];

			if (userToLogin) {
				//check if password matches
				const result = await bcrypt.compare(req.body.password, userToLogin.password);
				if (result) {
					// sign token and send it in response
					const token = await jwt.sign({ username: userToLogin.username }, SECRET);
					//console.log({ username: user.username, token });
					res.status(200).json({
						result: "SUCCESS",
						username: userToLogin.username,
						token,
					});
				} else {
					res.status(400).json({ error: "PASSWORD_MISMATCH" });
				}
			} else {
				res.status(400).json({ error: "User doesn't exist" });
			}
		});
	} catch (error) {
		res.status(400).json({ error });
	}
});

export default UserRouter;
