const express = require('express');

const router = express.Router();

const { check, body } = require('express-validator');

const User = require('../models/user');

const {
  getLogin,
  postLoginUser,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword
} = require('../controllers/auth');

router.get('/login', getLogin);

router.post(
  '/login',
  [
    check('email')
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage('Please enter a valid e-mail.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(user => {
          if (!user) {
            return Promise.reject(
              'E-mail address not found, please try again.'
            );
          }
        });
      }),
    body('password', 'Password must be longer than 5 characters')
      .isLength({ min: 5 })
      .trim()
  ],
  postLoginUser
);

router.post('/logout', postLogout);

router.get('/signup', getSignup);

router.post(
  '/signup',
  [
    check(
      'email'
      // "optional errorMessage string argument"
    )
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage('Please enter a valid e-mail.')
      .custom((value, { req }) => {
        // if (value === 'test@test') {
        //   throw new Error('This e-mail address is forbidden');
        // }
        // return true;
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              'Email exists already, please pick a different one.'
            );
          }
        });
      }),
    body(
      'password',
      'Password must be longer than 5 characters and must use text and numbers.'
    )
      .isLength({ min: 5 })
      .trim(),
    body(
      'confirmPassword'
      // 'Confirmed password does not match'
    )
      // equals('confirmPassword', 'password')
      // otherwise custom validator can be used
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Confirmed password does not match.');
        }
        return true;
      })
  ],
  postSignup
);

router.get('/reset', getReset);

router.post('/reset', postReset);

router.get('/new-password/:token', getNewPassword);

router.post('/new-password', postNewPassword);

module.exports = router;
