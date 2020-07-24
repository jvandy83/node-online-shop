const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const { validationResult } = require('express-validator');

const User = require('../models/user');
const {
  SENDGRID_USER,
  SENDGRID_PASSWORD,
  SENDGRID_SENDER
} = require('../config');

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_user: SENDGRID_USER,
      api_key: SENDGRID_PASSWORD
    }
  })
);

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Sign Up',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Sign Up',
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  bcrypt.hash(password, 12).then(hashPassword => {
    const user = new User({
      email: email,
      password: hashPassword,
      cart: { items: [] }
    });
    return user
      .save()
      .then(result => {
        res.redirect('/login');
      })
      .catch(err => console.log(err));
  });
};

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  console.log(message);
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    errorMessage: message,
    // isAuthenticated: req.session.isLoggedIn
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.postLoginUser = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  User.findOne({ email: email })
    .then(user => {
      bcrypt.compare(password, user.password).then(doMatch => {
        if (!doMatch) {
          req.flash('error', 'Invalid email or password');
          return res.redirect('/login');
        } else {
          req.session.isLoggedIn = true;
          req.session.user = user;
          req.session.save();
          return res.redirect('/');
        }
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode(500);
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  let token = null;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      res.redirect('/reset');
    }
    token = buffer.toString('hex');
  });
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        req.flash('error', 'No account with that email found');
        res.redirect('/reset');
      }
      // resetToken && resetTokenExpiration
      // only needed for resetting password
      // otherwise values should be set to undefined
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    })
    .then(result => {
      res.redirect('/');
      return transporter
        .sendMail({
          to: req.body.email,
          from: SENDGRID_SENDER,
          subject: 'Password reset',
          html: `<div>
          <p>Click the link below to reset your password</p>
          <a href="http://localhost:5000/new-password/${token}">Reset Password</a>
        </div>`
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  }).then(user => {
    resetUser = user;
    return bcrypt
      .hash(newPassword, 12)
      .then(hashedPassword => {
        resetUser.password = hashedPassword;
        // token and token expiration no longer
        // needed so now set to undefined
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser
          .save()
          .then(result => {
            res.redirect('/');
            return transporter.sendMail({
              to: user.email,
              from: SENDGRID_SENDER,
              subject: 'Updated Password',
              html: `<div>
                  <h3>Your password was successfully saved</h3>
                </div>`
            });
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  });
};
