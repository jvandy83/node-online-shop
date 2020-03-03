const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-product', { 
    pageTitle: 'Add Product', 
    path: '/admin/add-product',
    isAuthenticated: req.session.isLoggedIn,
  })
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({title: title, price: price, description: description, imageUrl: imageUrl, userId: req.session.user._id });
  product
    .save()
    .then(result => {
    res.redirect('/products')
    console.log('Created product');
  }).catch(err => console.log(err))
}

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.session.user._id })
    .then(products => {
    console.log(products);
    res.render('admin/products', { 
      pageTitle: 'Admin Products', 
      path: '/admin/products', 
      products: products,
    })
  }).catch(err => console.log(err))
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
    res.render('admin/edit-product', { 
      pageTitle: 'Edit Product', 
      path: '/admin/edit-product', 
      product: product,
      editing: editMode,
    })
  }).catch(err => console.log(err))
}

exports.postEditProduct = (req, res, next) => {
  const id = req.body.productId
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  Product.findById(id)
    .then(product => {
      product.title = title;
      product.imageUrl = imageUrl;
      product.price = price;
      product.description = description;
      return product.save()
    })
      .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err))
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product
    .deleteOne( { _id: prodId })
    .then(result => {
    res.redirect('/admin/products');
  }).catch(err => console.log(err))
}
