import { Router } from 'express';
import bcrypt from 'bcryptjs';
import authConfig from '@/config/auth';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Mailer from '@/modules/Mailer';
import User from '@/app/schemas/User';

const router = new Router();

const generateToken = (params) => {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
};

router.post('/register', (req, res) => {
  const { email, name, password } = req.body;

  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        return res.status(400).send({ error: 'User already exists!' });
      } else {
        User.create({ email, name, password })
          .then((user) => {
            user.password = undefined;
            return res.send({ user });
          })
          .catch((error) => {
            console.error('Erro saving user!', error);
            return res.status(400).send({ error: 'Bad request!' });
          });
      }
    })
    .catch((error) => {
      console.error('Error querying user in database!', error);
      return res.status(500).send({ error: 'Internal server error!' });
    });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .select('+password')
    .then((user) => {
      if (user) {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              const token = generateToken({ uid: user.id });
              return res.send({ token: token, tokenExpiration: '1d' });
            } else {
              return res.status(400).send({ error: 'Invalid password!' });
            }
          })
          .catch((error) => {
            console.error('Error checking password!', error);
            return res.status(500).send({ error: 'Internal server error!' });
          });
      } else {
        return res.status(404).send({ error: 'User not found!' });
      }
    })
    .catch((error) => {
      console.error('Login error!', error);
      return res.status(500).send({ error: 'Internal server error!' });
    });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        const expiration = new Date();
        expiration.setHours(new Date().getHours() + 3);

        User.findByIdAndUpdate(user.id, {
          $set: {
            passwordResetToken: token,
            passwordResetTokenExpiration: expiration,
          },
        })
          .then(() => {
            Mailer.sendMail(
              {
                to: email,
                from: 'webmaster@expresstest.com',
                subject: 'Forgot Password',
                template: 'auth/forgot_password',
                context: { token },
              },
              (error) => {
                if (error) {
                  console.log(error);
                  console.error('Error sending the email!');
                  return res.status(400).send({ error: 'Bad request!' });
                } else {
                  return res.send();
                }
              },
            );
          })
          .catch((error) => {
            console.error('Error saving the recovery password token!');
            return res.status(500).send({ error: 'Internal server error!' });
          });
      } else {
        return res.status(404).send({ error: 'User not found!' });
      }
    })
    .catch((error) => {
      console.error('Forgot password error!', error);
      return res.status(500).send({ error: 'Internal server error!' });
    });
});

router.post('/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;
  User.findOne({ email })
    .select('+passwordResetToken passwordResetTokenExpiration')
    .then((user) => {
      if (user) {
        if (
          token != user.passwordResetToken ||
          new Date().now > user.passwordResetTokenExpiration
        ) {
          return res.status(400).send({ error: 'Invalid token!' });
        } else {
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpiration = undefined;
          user.password = newPassword;

          user
            .save()
            .then(() => {
              return res
                .status(200)
                .send({ message: 'Password changed successfully.' });
            })
            .catch((error) => {
              console.error('Error saving new user password!', error);
              return res.status(500).send({ error: 'Internal server error!' });
            });
        }
      } else {
        return res.status(404).send({ error: 'User not found!' });
      }
    })
    .catch((error) => {
      console.error('Reset password error!', error);
      return res.status(500).send({ error: 'Internal server error!' });
    });
});

export default router;
