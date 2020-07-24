const express = require('express');

const { check, body } = require('express-validator');

const router = express.Router();

const {
  getAddProduct,
  postAddProduct,
  getProducts,
  getEditProduct,
  postEditProduct,
  deleteProduct
} = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

router.get('/add-product', isAuth, getAddProduct);

router.post(
  '/add-product',
  [
    body(
      'title',
      'Title must contain all letters and be at least 3 characters.'
    ).isLength({ min: 3 }),
    body('price', 'Price must be a valid dollar amount.').toFloat(),
    body('description', `Description must be at least 5 characters.`).isLength({
      min: 5
    })
  ],
  isAuth,
  postAddProduct
);

router.get('/edit-product/:productId', isAuth, getEditProduct);

router.post(
  '/edit-product',
  [
    body(
      'title',
      'Title must contain all letters and be at least 3 characters.'
    )
      .isAlpha()
      .isLength({ min: 3 }),
    body('price', 'Price must be a valid dollar amount.').isFloat(),
    body('description', `Description must be at least 5 characters.`).isLength({
      min: 5
    })
  ],
  isAuth,
  postEditProduct
);

router.delete('/product/:productId', isAuth, deleteProduct);

router.get('/products', isAuth, getProducts);

module.exports = router;
