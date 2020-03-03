const express = require('express');

const router = express.Router();

const { getIndex, getProducts, getProductDetail, getCart, postCart, postCartDeleteProduct, postOrder, getOrder } = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

router.get('/products', getProducts);

router.get('/', getIndex);

router.get('/product-detail/:productId', getProductDetail);

router.get('/cart', isAuth, getCart);

router.post('/cart/', isAuth, postCart);

router.post('/cart/delete-cart-product', isAuth, postCartDeleteProduct);

router.get('/orders', isAuth, getOrder);

router.post('/create-order', isAuth, postOrder);

module.exports = router;