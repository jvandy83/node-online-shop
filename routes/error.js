const express = require('express');

const { get404, get500 } = require('../controllers/error');

const router = express.Router();

router.use('/500', get500);

router.use(get404);

module.exports = router;
