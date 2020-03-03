const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');
const { sendgrid_user, sendgrid_password, sendgrid_sender } = require('../config');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_user: sendgrid_user,
    api_key: sendgrid_password
  } 
}))

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
    errorMessage: message
  })
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email})
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'E-mail already exists. Please try a different e-mail')
        return res.redirect('/signup')
      }
      return bcrypt.hash(password, 12)
      .then(hashPassword => {
        const user = new User({
          email: email,
          password: hashPassword,
          cart: {
            items: []
          }
        })
        return user.save()
        .then(result => {
          res.redirect('/login')
          return transporter.sendMail({
            to: email,
            from: sendgrid_sender,
            subject: 'Sign up succeeded!',
            html: '<h1>You successfully signed up!</h1>'
          })
        })
        .catch(err => console.log(err));
      })
    })
    .catch(err => console.log(err))
}

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null;
  }
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    errorMessage: message
  })
}

exports.postLoginUser = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email})
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/login');
      }
      return bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (!doMatch) {
            req.flash('error', 'Invalid email or password');
            res.redirect('/login');
          } else {
            req.session.isLoggedIn = true;
              req.session.user = user;
              return req.session.save(err => {
                console.log(err);
                res.redirect('/');
              })
            }
      })
        .catch(err => {
          console.log(err);
          res.redirect('/login')
        })
    })
  .catch(err => console.log(err))
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  })
}

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
  })
}

exports.postReset = (req, res, next) => {
  let token = null;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err)
      res.redirect('/reset');
    } 
    token = buffer.toString('hex');
  })
  User.findOne( { email: req.body.email } )
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
      return transporter.sendMail({
        to: req.body.email,
        from: sendgrid_sender,
        subject: 'Password reset',
        html: 
        `<div>
          <p>Click the link below to reset your password</p>
          <a href="http://localhost:5000/new-password/${token}">Reset Password</a>
        </div>`
      })
      .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } 
  })
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
    })
  })
  .catch(err => console.log(err));
}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken
  let resetUser;

  User.findOne({ 
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId 
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12)
        .then(hashedPassword => {
          resetUser.password = hashedPassword;
          // token and token expiration no longer
          // needed so now set to undefined
          resetUser.resetToken = undefined;
          resetUser.resetTokenExpiration = undefined;
          return resetUser.save()
            .then(result => {
              res.redirect('/');
              return transporter.sendMail({
                to: user.email,
                from: sendgrid_sender,
                subject: 'Updated Password',
                html: 
                `<div>
                  <h3>Your password was successfully saved</h3>
                </div>`
              })
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err))
    })
}
