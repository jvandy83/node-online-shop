const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const app = express();

const MONGODB_URI = "mongodb+srv://jared123:jared123@vanthedev-k2rxc.mongodb.net/shop"

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
})

const csrfProtection = csrf();

const shopRoutes = require('./routes/shop');

const adminRoutes = require('./routes/admin');

const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ 
  secret: 'my secret', 
  resave: false, 
  saveUninitialized: false, 
  store: store 
  })
)

app.use(csrfProtection);
app.use(flash());

app.set('view engine', 'ejs');

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use(shopRoutes);
app.use('/admin', adminRoutes);
app.use(authRoutes);

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => {
    app.listen(5000);
})
.catch(err => console.log(err));
