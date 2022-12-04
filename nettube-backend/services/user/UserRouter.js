//require("dotenv").config(); // load .env variables
import { Router } from "express"; // import router from express
import bcrypt from "bcryptjs"; // import bcrypt to hash passwords
import jwt from "jsonwebtoken"; // import jwt to sign tokens
import { isUserInDB, createUser } from "./User.js";
import { sendConfirmationEmail } from "../mail/Mail.js";

const UserRouter = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
// const { SECRET = "secret" } = process.env;

// Signup route to create a new user
UserRouter.post("/signup", async (req, res) => {
	console.log(req.body);
	try {
		const isUserAlreadySigned = await isUserInDB({ username: req.body.username });
		if (!isUserAlreadySigned) {
			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			const userToRegister = {
				username: req.body.username,
				fullname: req.body.fullname,
				password: hashedPassword,
				birthdate: req.body.birthdate,
				email: req.body.email,
			};
			const signupResult = await createUser(...userToRegister);
			sendConfirmationEmail(userToRegister.email);
			res.status(200).json({ result: signupResult });
		}
		res.status(400).json({ result: "ALREADY_SIGNED" });
	} catch (error) {
		res.status(400).json({ error });
	}
});

// Login route to verify a user and get a token
UserRouter.post("/login", async (req, res) => {
	try {
		// check if the user exists
		const user = await findOneUser({ username: req.body.username });
		if (user) {
			//check if password matches
			const result = await bcrypt.compare(req.body.password, user.password);
			if (result) {
				// sign token and send it in response
				const token = await jwt.sign({ username: user.username });
				res.json({ token });
			} else {
				res.status(400).json({ error: "password doesn't match" });
			}
		} else {
			res.status(400).json({ error: "User doesn't exist" });
		}
	} catch (error) {
		res.status(400).json({ error });
	}
});

export default UserRouter;
