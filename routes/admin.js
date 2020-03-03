const express = require('express');

const router = express.Router();

const { getAddProduct, postAddProduct, getProducts, getEditProduct, postEditProduct, postDeleteProduct } = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

router.get('/add-product', isAuth, getAddProduct);

router.post('/add-product', isAuth, postAddProduct);

router.get('/edit-product/:productId', isAuth, getEditProduct)

router.post('/edit-product', isAuth, postEditProduct);

router.post('/delete-product', isAuth, postDeleteProduct);

router.get('/products', isAuth, getProducts);

module.exports = router;
