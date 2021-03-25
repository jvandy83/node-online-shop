const fs = require('fs');
const path = require('path');
// @ts-ignore
const stripe = require('stripe')(`sk_test_D4pNByx08dJpJShCHbDp79Y70007pq01Qn`);
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  Product.find({})
    .skip(ITEMS_PER_PAGE * page - ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .exec((err, products) => {
      return (
        // @ts-ignore
        Product.countDocuments().exec((err, count) => {
          if (err) return next(err);
          res.render('shop/index', {
            pageTitle: 'Index',
            path: '/',
            products: products,
            current: page,
            // @ts-ignore
            pages: Math.ceil(count / ITEMS_PER_PAGE)
          });
        })
      );
    });
};

exports.getProducts = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  Product.find({})
    .skip(ITEMS_PER_PAGE * page - ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .exec((err, products) => {
      return (
        // @ts-ignore
        Product.countDocuments().exec((err, count) => {
          if (err) return next(err);
          res.render('shop/product-list', {
            pageTitle: 'Product List',
            path: '/product-list',
            products: products,
            current: page,
            // @ts-ignore
            pages: Math.ceil(count / ITEMS_PER_PAGE)
          });
        })
      );
    });
};

exports.getProductDetail = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      console.log(product);
      res.render('shop/product-details', {
        pageTitle: 'Details',
        path: '/product-detail',
        product: product
      });
    })
    .catch((err) => {
      const error = new Error(err.message);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  User.findById(req.session.user._id).then((user) => {
    user
      .populate('cart.items.productId')
      .execPopulate()
      .then((user) => {
        const products = user.cart.items;
        console.log(products);
        res.render('shop/cart', {
          products: products,
          pageTitle: 'Your Cart',
          path: '/cart'
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.postCart = (req, res, next) => {
  let prodId = req.body.productId;
  User.findById(req.session.user._id).then((user) => {
    Product.findById(prodId)
      .then((product) => {
        return user.addToCart(product);
      })
      .then((result) => {
        res.redirect('/cart');
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  User.findById(req.session.user._id).then((user) => {
    user
      .removeFromCart(prodId)
      .then((result) => {
        res.redirect('/cart');
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  const protocol = req.protocol;
  const host = req.get('host');
  const success = '/checkout/success';
  const cancel = '/checkout/cancel';

  User.findById(req.session.user._id).then((user) => {
    user
      .populate('cart.items.productId')
      .execPopulate()
      .then((user) => {
        products = user.cart.items;
        products.forEach((p) => {
          total += p.productId.price;
        });
        return stripe.checkout.sessions
          .create({
            payment_method_types: ['card'],
            line_items: products.map((p) => {
              return {
                name: p.productId.title,
                description: p.productId.description,
                amount: Number(p.productId.price * 100),
                currency: 'usd',
                quantity: p.quantity
              };
            }),
            success_url: protocol + '://' + host + success,
            cancel_url: protocol + '://' + host + cancel
          })
          .then((session) => {
            user.clearCart();
            res
              .render('shop/checkout', {
                pageTitle: 'Checkout',
                path: '/checkout',
                products: products,
                totalSum: total.toFixed(2),
                sessionId: session.id
              })
              .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
          });
      });
  });
};

exports.getCheckoutSuccess = (req, res, next) => {
  User.findById(req.session.user._id).then((user) => {
    user
      .populate('cart.items.productId')
      .execPopulate()
      .then((user) => {
        const prods = user.cart.items;
        products = prods.map((i) => {
          return { quantity: i.quantity, product: { ...i.productId._doc } };
        });
        const order = new Order({
          user: {
            email: user.email,
            userId: user._id
          },
          products: products
        });
        return order.save();
      })
      .then(() => {
        res.redirect('/orders');
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getOrder = (req, res, next) => {
  Order.find({ 'user.userId': req.session.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        pageTitle: 'Your Order',
        path: '/orders',
        orders: orders
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error('No order found!'));
      }
      const sessionUserId = req.session.user._id.toString();
      const orderUserId = order.user.userId.toString();
      if (sessionUserId !== orderUserId) {
        return next(new Error('Not authorized!'));
      }
      const invoiceName = 'Invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', `inline; filename="' + invoiceName + '"`)
      //   res.send(data);
      // });
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"'
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfDoc.fontSize(14).text('-------------------');

      let totalPrice = 0;

      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              ' - ' +
              prod.quantity +
              ' x ' +
              '$' +
              prod.product.price
          );
      });
      pdfDoc.text('-------------------');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice.toFixed(2));

      pdfDoc.end();

      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader(
      //   'Content-Disposition',
      //   'inline; filename="' + invoiceName + '"'
      // );
      // file.pipe(res);
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// .skip(ITEMS_PER_PAGE * (page - 1))
// .limit(ITEMS_PER_PAGE)
// .then((products) => {
//   res.render('shop/product-list', {
//     pageTitle: 'Product List',
//     path: '/product-list',
//     products: products,
//     currentPage: page,
//     hasNextPage: ITEMS_PER_PAGE * page < totalItems,
//     hasPreviousPage: page > 1,
//     nextPage: page + 1,
//     previousPage: page - 1,
//     lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
//   });
// })
