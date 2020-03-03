const express = require('express');

const router = express.Router();

const { getLogin, postLoginUser, postLogout, getSignup, postSignup, getReset, postReset, getNewPassword, postNewPassword } = require('../controllers/auth');

router.get('/login', getLogin);

router.post('/login', postLoginUser);

router.post('/logout', postLogout);

router.get('/signup', getSignup);

router.post('/signup', postSignup);

router.get('/reset', getReset);

router.post('/reset', postReset);

router.get('/new-password/:token', getNewPassword);

router.post('/new-password', postNewPassword);

module.exports = router;
