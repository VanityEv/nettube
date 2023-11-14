import * as dotenv from 'dotenv';
dotenv.config();
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  isUserInDB,
  createUser,
  getAllUsers,
  findOneUser,
  confirmUser,
  updateUser,
  userLikes,
  checkOccurency,
  deleteLike,
  addLike,
  deleteUser,
  updateUserLoginDate,
} from './User.js';
import { sendConfirmationEmail } from '../mail/Mail.js';

const UserRouter = Router();

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { SECRET = 'secret' } = process.env;

// Signup route to create a new user
UserRouter.post('/signup', async (req, res) => {
  try {
    await isUserInDB(req.body.username, async data => {
      const isUserAlreadySigned = data[0].count > 0;
      if (!isUserAlreadySigned) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const registerToken = Math.floor(Math.random() * 1000000);
        const userToRegister = {
          username: req.body.username,
          fullname: req.body.fullname,
          password: hashedPassword,
          birthdate: req.body.birthdate,
          email: req.body.email,
          subscription: req.body.subscription,
          registerToken: registerToken,
        };

        await createUser({ ...userToRegister }, status => {
          if (status.affectedRows === 1) {
            sendConfirmationEmail(userToRegister.email, registerToken);
            res.status(200).json({ result: 'SUCCESS' });
          } else {
            res.status(400).json({ error: 'INTERNAL_ERROR' });
          }
        });
      } else {
        res.json({ error: 'ALREADY_SIGNED' });
      }
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Login route to verify a user and get a token
UserRouter.post('/signin', async (req, res) => {
  if (req.body.password) {
    try {
      // check if the user exists
      await findOneUser(req.body.username, async user => {
        const userToLogin = user[0];

        if (userToLogin) {
          //check if password matches
          const result = await bcrypt.compare(req.body.password, userToLogin.password);
          if (result) {
            await updateUserLoginDate(req.body.username, () => {});
            // sign token and send it in response
            const token = await jwt.sign({ username: userToLogin.username }, SECRET);

            res.status(200).json({
              result: 'SUCCESS',
              username: userToLogin.username,
              account_type: userToLogin.account_type,
              token,
            });
          } else {
            res.status(401).json({ error: 'PASSWORD_MISMATCH' });
          }
        } else {
          res.status(401).json({ error: "User doesn't exist" });
        }
      });
    } catch (error) {
      res.status(400).json({ error });
    }
  } else if (req.body.token) {
    try {
      await findOneUser(req.body.username, async user => {
        const userToLogin = user[0];
        if (userToLogin) {
          if (jwt.decode(req.body.token).username === userToLogin.username) {
            await updateUserLoginDate(userToLogin.username, () => {});
            res.status(200).json({
              result: 'SUCCESS',
              username: userToLogin.username,
              token: req.body.token,
            });
          } else {
            res.status(401).json({ error: 'TOKEN_MISMATCH' });
          }
        } else {
          res.status(401).json({ error: "User doesn't exist" });
        }
      });
    } catch (error) {
      res.status(400).json({ error });
    }
  }
});

UserRouter.post('/confirmRegister', async (req, res) => {
  try {
    await confirmUser(req.body.token, async response => {
      const status = response.changedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'This token has expired!' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/getUserData', async (req, res) => {
  try {
    await findOneUser(req.body.username, async user => {
      const userData = user[0];
      if (userData) {
        res.status(200).json({
          result: 'SUCCESS',
          username: userData.username,
          fullname: userData.fullname,
          email: userData.email,
          subscription: userData.subscription,
          birthdate: userData.birthdate,
        });
      } else {
        res.status(400).json({ error: 'USER NOT LOGGED IN' });
      }
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.get('/userLikes/:username', async (req, res) => {
  try {
    const username = req.params.username;
    await userLikes(username, userLikes => {
      res.status(200).json({ result: 'SUCCESS', data: userLikes });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/updateUser', async (req, res) => {
  try {
    await updateUser(req.body.param, req.body.value, req.body.username, async response => {
      const status = response.changedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'UPDATE FAILED' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/checkOccurency', async (req, res) => {
  try {
    await checkOccurency(req.body.param, req.body.value, async response => {
      const status = response[0].exists === 0 ? 'NOT EXISTS' : 'ALREADY EXISTS';
      res.status(200).json({ result: status });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/deleteLike', async (req, res) => {
  try {
    await deleteLike(req.body.username, req.body.show_title, async response => {
      const status = response.affectedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'ERROR' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/addLike', async (req, res) => {
  try {
    await addLike(req.body.username, req.body.show_title, async response => {
      const status = response.affectedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'ERROR' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.get('/getAllUsers', async (req, res) => {
  try {
    await getAllUsers(users => {
      res.status(200).json({ result: 'success', data: users });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/deleteUser', async (req, res) => {
  try {
    await deleteUser(req.body.id, async response => {
      const status = response.affectedRows === 1;
      status ? res.status(200).json({ result: 'success' }) : res.status(500).json({ error: 'error' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.get('/getAllUsers', async (req, res) => {
  try {
    await getAllUsers(users => {
      res.status(200).json({ result: 'success', data: users });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/deleteUser', async (req, res) => {
  try {
    await deleteUser(req.body.id, async response => {
      const status = response.affectedRows === 1;

      status ? res.status(200).json({ result: 'success' }) : res.status(500).json({ error: 'error' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default UserRouter;
