const express = require('express');

const router = express.Router();

const {
  getIndex,
  getProducts,
  getProductDetail,
  getCart,
  postCart,
  postCartDeleteProduct,
  // postOrder,
  getOrder,
  getInvoice,
  getCheckout,
  getCheckoutSuccess
} = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

router.get('/products', getProducts);

router.get('/', getIndex);

router.get('/product-detail/:productId', getProductDetail);

router.get('/cart', isAuth, getCart);

router.post('/cart', isAuth, postCart);

router.post('/cart/delete-cart-product', isAuth, postCartDeleteProduct);

router.get('/orders', isAuth, getOrder);

router.get('/checkout', isAuth, getCheckout);

router.get('/checkout/success', getCheckoutSuccess);

router.get('/checkout/cancel', getCheckout);

router.get('/orders/:orderId', isAuth, getInvoice);

module.exports = router;
