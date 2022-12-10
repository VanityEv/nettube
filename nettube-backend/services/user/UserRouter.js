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

//Error tu:
// const signupResult = await createUser(...userToRegister);
//TypeError: Spread syntax requires ...iterable[Symbol.iterator] to be a function
//at file:///C:/Users/Pawe%C5%82/Documents/GitHub/nettube/nettube-backend/services/user/UserRouter.js:29:36

/**throw err; // Rethrow non-MySQL errors
      ^
TypeError: callback is not a function
 * Przy tworzeniu nowego użytkownika (dodaje do bazy z tego co widzę - do fixu na jutro)
 */

// Signup route to create a new user
UserRouter.post("/signup", async (req, res) => {
  try {
    await isUserInDB(req.body.username, async (user) => {
      const isUserAlreadySigned = user[0];
      console.log(isUserAlreadySigned);
      if (!isUserAlreadySigned) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const userToRegister = {
          username: req.body.username,
          fullname: req.body.fullname,
          password: hashedPassword,
          birthdate: req.body.birthdate,
          email: req.body.email,
        };
        const signupResult = await createUser(
          userToRegister.username,
          userToRegister.fullname,
          userToRegister.password,
          userToRegister.birthdate,
          userToRegister.email
        );
        sendConfirmationEmail(userToRegister.email);
        res.status(200).json({ result: signupResult });
      } else {
        res.status(400).json({ result: "ALREADY_SIGNED" });
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
        const result = await bcrypt.compare(
          req.body.password,
          userToLogin.password
        );
        if (result) {
          // sign token and send it in response
          const token = await jwt.sign(
            { username: userToLogin.username },
            SECRET
          );
          //console.log({ username: user.username, token });
          res.status(200).json({ username: userToLogin.username, token });
        } else {
          res.status(400).json({ error: "password doesn't match" });
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
