const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  password: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  }
});

userSchema.methods.removeFromCart = function(id) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item._id.toString() !== id.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.addToCart = function(product) {
  const prodIdx = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQty = 1;
  const updatedCartItems = [...this.cart.items];

  if (prodIdx !== -1) {
    newQty = updatedCartItems[prodIdx].quantity + 1;
    updatedCartItems[prodIdx].quantity = newQty;
  } else {
    updatedCartItems.push({ productId: product._id, quantity: newQty });
  }
  const updatedCart = { items: updatedCartItems };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  this.save();
};

module.exports = mongoose.model('User', userSchema);

// const getDb = require('../util/database').getDb;

// const Product = require('./product');

// const mongodb = require('mongodb');
// const ObjectId = mongodb.ObjectId;

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email;
//     this.cart = cart; // {items: []}
//     this._id = new ObjectId(id)
//   }

//   save() {
//     const db = getDb();
//     return db
//       .collection('users')
//       .insertOne(this)
//   }

//   addToCart(product) {
//     const db = getDb();
//     let newQty = 1;
//     const updatedCart = { items: [{ productId: new ObjectId(product._id), quantity: newQty }] }
//     if (!this.cart.items) {
//       return db
//         .collection('users')
//         .updateOne(
//           { _id: new ObjectId(this._id)},
//           { $set: { cart: updatedCart }}
//         )
//     } else {
//       const updatedCartItems = [...this.cart.items];
//       const prodIdx = updatedCartItems.findIndex(cp => {
//         return cp.productId.toString() === product._id.toString();
//       })
//       if (prodIdx !== -1) {
//         newQty = updatedCartItems[prodIdx].quantity + 1;
//         updatedCartItems[prodIdx].quantity = newQty;
//       } else {
//         updatedCartItems.push({productId: new ObjectId(product._id), quantity: newQty } )
//       }
//       const updateExistingCart = { items: updatedCartItems };
//       return db
//         .collection('users')
//         .updateOne(
//           { _id: new ObjectId(this._id)},
//           { $set: { cart: updateExistingCart } }
//         )
//     }
//   }

//   fetchCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map(i => {
//       return i.productId;
//     })
//     return db
//       .collection('products')
//       .find(
//         { _id: { $in: productIds }}
//       )
//       .toArray()
//       .then(products => {
//         return products.map(p => {
//           return { ...p, quantity: this.cart.items.find(i => {
//             return p._id.toString() === i.productId.toString()
//           }).quantity };
//         })
//       })
//   }

//   addOrder() {
//     const db = getDb();
//     const order = { items: [], user: {} }
//     const productIds = this.cart.items.map(i => {
//       return i.productId;
//     })
//     return db
//       .collection('products')
//       .find(
//         { _id: { $in: productIds }}
//       )
//       .toArray()
//       .then(products => {
//         products.map(p => {
//           this.cart.items.map(i => {
//             if (p._id.toString() === i.productId.toString()) {
//               order.items.push({ ...p, totalPrice: p.price * i.quantity, quantity: i.quantity })
//               order.user._id = this._id;
//               order.user.name = this.name;
//               order.user.email = this.email;
//             }
//           })
//         })
//         return db
//           .collection('orders')
//           .insertOne(order)
//           .then(result => {
//             this.cart = { items: [] };
//             return db
//               .collection('users')
//               .updateOne(
//                 { _id: new ObjectId(this._id)},
//                 { $set: { cart: { items: [] } } }
//               )
//           })
//       })
//     // return this.fetchCart()
//     //   .then(products => {
//     //     const order = {
//     //       items: products,
//     //       user: { _id: this._id, name: this.name, email: this.email }
//     //     }
//     //     return db
//     //       .collection('orders')
//     //       .insertOne(order)
//     //       .then(result => {
//     //         this.cart = { items: [] }
//     //         return db
//     //           .collection('users')
//     //           .updateOne(
//     //             { _id: new ObjectId(this._id)},
//     //             { $set: { cart: { items: [] } } }
//     //           )
//     //       })
//     //   })
//     }

//   fetchOrder() {
//     const db = getDb();
//     return db
//       .collection('orders')
//       .find({ 'user._id': new ObjectId(this._id) })
//       .toArray()
//   }

//   deleteCartItem(prodId) {
//     const db = getDb();
//     const updatedCartItems = this.cart.items.filter(p => {
//       return p.productId.toString() !== prodId.toString();
//     })
//     return db
//       .collection('users')
//       .updateOne(
//         { _id: new ObjectId(this._id)},
//         { $set: {cart: {items: updatedCartItems } } }
//       )
//   }

//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection('users')
//       .findOne(
//         { _id: new mongodb.ObjectId(userId)}
//       )
//   }
// }

// module.exports = User;
