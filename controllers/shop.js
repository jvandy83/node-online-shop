const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

exports.getIndex = (req, res, next) => {
  
  Product.find() 
    .then(products => {
      res.render('shop/index', { 
        pageTitle: 'Shop', 
        path: '/', 
        products: products
      })
    })
    .catch(err => console.log(err));
}

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products  => {
    res.render('shop/product-list', { 
      pageTitle: 'All Products', 
      path: '/product-list', 
      products: products,
    })
  }).catch(err => console.log(err))
}

exports.getProductDetail = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
    res.render('shop/product-details', { 
      pageTitle: 'Details',
      path: '/product-detail',
      product: product,
    })
  }).catch(err => console.log(err))
}

exports.getCart = (req, res, next) => {
  User.findById(req.session.user._id)
      .then(user => {
        user
          .populate('cart.items.productId')
          .execPopulate()
          .then(user => {
          const products = user.cart.items;
            res.render('shop/cart', { 
              products: products,
              pageTitle: 'Your Cart', 
              path: '/cart',
            })
          })
          .catch(err => console.log(err))
      })    
}

exports.postCart = (req, res, next) => {
  let prodId = req.body.productId;
  User.findById(req.session.user._id)
    .then(user => {
      Product
        .findById(prodId)
        .then(product => {
          return user.addToCart(product)
        })
        .then(result => {
          res.redirect('/cart');
        })
        .catch(err => console.log(err))
    })
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  User.findById(req.session.user._id)
    .then(user => {
      user
        .removeFromCart(prodId)
        .then(result => {
          res.redirect('/cart')
        })
        .catch(err => console.log(err));
    })
}

exports.postOrder = (req, res, next) => {
  User.findById(req.session.user._id)
    .then(user => {
      user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
          const products = user.cart.items.map(i => {
            return { quantity: i.quantity, product: { ...i.productId._doc } }
          });
          const order = new Order({
            user: {
              email: user.email,
              userId: user._id
            },
            products: products
          })
          return order.save()
        })
        .then(result => {
          return user.clearCart();
        })
        .then(() => {
          res.redirect('/orders');
        })
        .catch(err => console.log(err));
    })
}

exports.getOrder = (req, res, next) => {
  Order
    .find({'user.userId': req.session.user._id })
    .then(orders => {
      res.render('shop/orders', {
        pageTitle: 'Your Order',
        path: '/orders',
        orders: orders,
      })
  })
  .catch(err => console.log(err))
}
