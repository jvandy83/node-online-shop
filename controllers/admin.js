const Product = require('../models/product');
const fileHelper = require('../util/file');

const { validationResult } = require('express-validator');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    product: {
      title: '',
      image: '',
      price: '',
      description: ''
    },
    hasError: false,
    errorMessage: '',
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      path: '/admin/add-product',
      pageTitle: 'Add Product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: []
    });
  }
  const imageUrl = image.path;
  // extract errors
  const errors = validationResult(req);
  // create new Product
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.session.user._id
  });
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      path: '/admin/add-product',
      pageTitle: 'Add Product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        image: image,
        // price: price,
        description: description
      },
      validationErrors: errors.array()
    });
  }
  product
    .save()
    .then((result) => {
      return res.redirect('/products');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  Product.find({ userId: req.session.user._id })
    .skip(ITEMS_PER_PAGE * page - ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .exec((err, products) => {
      // @ts-ignore
      Product.countDocuments().exec((err, count) => {
        if (err) return next(err);
        res.render('admin/products', {
          pageTitle: 'Admin Products',
          path: '/admin/products',
          products: products,
          current: page,
          // @ts-ignore
          pages: Math.ceil(count / ITEMS_PER_PAGE)
        });
      });
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        product: product,
        editing: editMode,
        validationErrors: [],
        errorMessage: null,
        hasError: false
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;
  // extract errors array from express-validation in routes
  const errors = validationResult(req);
  Product.findById(prodId).then((product) => {
    // extract userId from product along with session user._id
    const prodUserId = product.userId.toString();
    const sessionUserId = req.session.user._id.toString();
    // check if product belongs to user
    if (prodUserId !== sessionUserId) {
      return res.redirect('/');
    } else if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        validationErrors: errors.array(),
        editing: true,
        hasError: true,
        product: {
          title: updatedTitle,
          price: updatedPrice,
          description: updatedDescription,
          _id: prodId
        }
      });
    } else {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product
        .save()
        .then((result) => {
          return res.redirect('/admin/products');
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    }
  });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({
        _id: prodId,
        // ensure that product belongs to user
        userId: req.session.user._id
      });
    })
    .then((result) => {
      res.status(200).json({
        message: 'Success'
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: 'Delete product failed!'
      });
    });
};

// return Product.find()
//   .skip(ITEMS_PER_PAGE * (page - 1))
//   .limit(ITEMS_PER_PAGE)
//   .then((products) => {
//     res.render('admin/products', {
//       pageTitle: 'Admin Products',
//       path: '/admin/products',
//       products: products,
//       currentPage: page,
//       hasNextPage: ITEMS_PER_PAGE * page < totalItems,
//       hasPreviousPage: page > 1,
//       nextPage: page + 1,
//       previousPage: page - 1,
//       lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
//     });
//   })
