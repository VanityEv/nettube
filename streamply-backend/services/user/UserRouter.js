import * as dotenv from 'dotenv';
dotenv.config();
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
  changePassword,
  findOneUserByEmail,
  addPasswordResetToken,
  updatePassword,
  revokeToken,
  promoteUser,
  demoteUser,
} from './User.js';
import { sendConfirmationEmail, sendPasswordResetMail } from '../mail/Mail.js';
import multer from 'multer';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { verifyAdmin, verifyToken, verifyUser, verifyUsername } from '../../helpers/verifyToken.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UserRouter = Router();

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { SECRET = 'secret' } = process.env;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userFolderPath = path.join(__dirname, '../..', 'images', 'avatars');
    cb(null, userFolderPath);
  },
  filename: function (req, file, cb) {
    const username = req.params.username;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `${username}${fileExtension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.jpeg', '.jpg', '.png'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed.'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

UserRouter.get('/getAvatar/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const avatarFormats = ['.jpeg', '.jpg', '.png'];
    const avatarPath = avatarFormats
      .map(format => path.join(__dirname, '../..', 'images', 'avatars', `${username}${format}`))
      .find(path => fs.existsSync(path));

    if (avatarPath) {
      const fileExtension = path.extname(avatarPath).toLowerCase();
      const resultPath = `/images/avatars/${username}${fileExtension}`;
      res.status(200).json({ result: resultPath });
    } else {
      res.status(200).json({ result: 'AVATAR_NOT_FOUND' });
    }
  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', details: error.message });
  }
});

UserRouter.post('/uploadAvatar/:username', verifyToken, verifyUser, upload.single('avatar'), async (req, res) => {
  try {
    //Delete previous avatar file
    const username = req.params.username;
    const otherAvatarFormats = ['.jpeg', '.jpg', '.png'].filter(
      format => path.extname(req.file.originalname).toLowerCase() !== format
    );
    otherAvatarFormats.forEach(extension => {
      const filename = path.join(__dirname, '../..', 'images', 'avatars', `${username}${extension}`);
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
    });
    res.status(200).json({ result: 'SUCCESS' });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Signup route to create a new user
UserRouter.post('/signup', async (req, res) => {
  try {
    await isUserInDB(req.body.username, req.body.email, async data => {
      const isUserAlreadySigned = data[0].count > 0;
      if (!isUserAlreadySigned) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const registerToken = crypto.randomBytes(16).toString('hex');
        const userToRegister = {
          username: req.body.username,
          fullname: req.body.fullname,
          password: hashedPassword,
          birthdate: req.body.birthdate,
          email: req.body.email,
          registerToken: registerToken,
        };

        await createUser({ ...userToRegister }, status => {
          if (status.affectedRows === 1) {
            sendConfirmationEmail(userToRegister.email, registerToken);
            res.status(200).json({ result: 'SUCCESS' });
          } else {
            res.status(400).json({ result: 'INTERNAL_ERROR' });
          }
        });
      } else {
        res.status(409).json({ result: 'ALREADY_SIGNED' });
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
            const token = jwt.sign({ username: userToLogin.username, account_type: userToLogin.account_type }, SECRET);

            res.status(200).json({
              result: 'SUCCESS',
              username: userToLogin.username,
              account_type: userToLogin.account_type,
              confirmed: userToLogin.confirmed,
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

UserRouter.post('/changePassword', verifyToken, verifyUser, verifyUsername, async (req, res) => {
  try {
    //find user to update
    await findOneUser(req.body.username, async user => {
      const userToConfirm = user[0];
      //user found
      if (userToConfirm) {
        //check JWT token compatibility
        if (jwt.decode(req.body.token).username === userToConfirm.username) {
          //check if oldPassword matches one in database
          bcrypt.compare(req.body.oldPassword, userToConfirm.password, async (err, response) => {
            if (err) {
              res.json({ result: 'ERR_PASSWORD_MISMATCH' });
            }
            if (response) {
              //change user password
              const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
              await changePassword(userToConfirm.username, hashedPassword, () => {});
              res.status(200).json({ result: 'SUCCESS' });
            } else {
              res.status(401).json({ result: 'ERR_PASSWORD_MISMATCH' });
            }
          });
        } else {
          res.status(401).json({ result: 'ERR_JWT_MISMATCH' });
        }
      } else {
        res.status(401).json({ result: 'ERR_INVALID_USERNAME' });
      }
    });
  } catch (error) {
    res.status(500).json({ result: 'INTERNAL SERVER ERROR' });
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

UserRouter.post('/resendConfirmation', async (req, res) => {
  try {
    await findOneUserByEmail(req.body.email, async user => {
      if (!user) {
        res.status(404).json({ result: 'NOT_FOUND' });
      }
      sendConfirmationEmail(user.email, user.register_token);
      res.status(200).json({ result: 'SUCCESS' });
    });
  } catch (error) {
    res.status(500).json({ result: 'INTERNAL_ERROR' });
  }
});

UserRouter.post('/getUserData', verifyToken, verifyUser, verifyUsername, async (req, res) => {
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
      res.status(200).json(userLikes);
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/updateUser', verifyToken, verifyUser, verifyUsername, async (req, res) => {
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

UserRouter.post('/checkOccurency', verifyToken, async (req, res) => {
  try {
    await checkOccurency(req.body.param, req.body.value, async response => {
      const status = response[0].exists === 0 ? 'NOT_EXISTS' : 'ALREADY_EXISTS';
      res.status(200).json({ result: status });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/deleteLike', verifyToken, verifyUser, verifyUsername, async (req, res) => {
  try {
    await deleteLike(req.body.username, req.body.show_id, async response => {
      const status = response.affectedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'ERROR' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/addLike', verifyToken, verifyUser, verifyUsername, async (req, res) => {
  try {
    await addLike(req.body.username, req.body.show_id, async response => {
      const status = response.affectedRows === 1 ? 'SUCCESS' : 'ERROR';
      if (status === 'SUCCESS') res.status(200).json({ result: 'SUCCESS' });
      if (status === 'ERROR') res.status(500).json({ error: 'ERROR' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.get('/getAllUsers',verifyToken, verifyAdmin, async (req, res) => {
  try {
    await getAllUsers(users => {
      res.status(200).json({ result: 'SUCCESS', data: users });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/deleteUser',verifyToken, verifyAdmin, async (req, res) => {
  try {
    await deleteUser(req.body.id, async response => {
      const status = response.affectedRows === 1;
      status ? res.status(200).json({ result: 'SUCCESS' }) : res.status(500).json({ error: 'error' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

UserRouter.post('/resetPassword', async (req, res) => {
  try {
    await findOneUserByEmail(req.body.email, async response => {
      const user = response[0];
      if (!user) {
        res.status(404).json({ result: 'NOT FOUND' });
      }
      const token = jwt.sign({ email: req.body.email }, SECRET, { expiresIn: '30m' });
      await addPasswordResetToken(user.email, token, async result => {
        if (result.affectedRows === 1) {
          sendPasswordResetMail(user.email, token);
          res.status(200).json({ result: 'SUCCESS' });
        }
      });
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ error });
  }
});

UserRouter.post('/setPassword', async (req, res) => {
  try {
    const { email, token } = req.body;

    await findOneUserByEmail(email, async response => {
      const user = response[0];

      if (!user) {
        return res.status(404).json({ result: 'NOT FOUND' });
      }

      try {
        const decoded = jwt.verify(token, SECRET);

        if (decoded.email !== email) {
          return res.status(401).json({ result: 'EMAIL MISMATCH' });
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await updatePassword(user.id, hashedPassword, async updateResponse => {
          if (updateResponse.affectedRows === 1) {
            await revokeToken(user.id, async response => {
              if (response.affectedRows === 1) {
                res.status(200).json({ result: 'SUCCESS' });
              }
            });
          } else {
            res.status(500).json({ result: 'ERROR' });
          }
        });
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ result: 'TOKEN EXPIRED' });
        } else {
          console.error(err);
          return res.status(401).json({ result: 'INVALID TOKEN' });
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

UserRouter.post('/promoteToModerator', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await findOneUser(req.body.username, async response => {
      const user = response[0];

      if (!user) {
        return res.status(404).json({ result: 'NOT FOUND' });
      }

      if (user.account_type === 1) {
        await promoteUser(user.id, async response => {
          if (response.affectedRows === 1) {
            res.status(200).json({ result: 'SUCCESS' });
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json({ result: 'ERROR' });
  }
});

UserRouter.post('/demoteModerator', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await findOneUser(req.body.username, async response => {
      const user = response[0];

      if (!user) {
        return res.status(404).json({ result: 'NOT FOUND' });
      }
      if (user.account_type === 2) {
        await demoteUser(user.id, async response => {
          if (response.affectedRows === 1) {
            res.status(200).json({ result: 'SUCCESS' });
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json({ result: 'ERROR' });
  }
});

export default UserRouter;
