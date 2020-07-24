require('dotenv').config();

module.exports = {
  SENDGRID_USER: process.env.SENDGRID_USER_NAME,
  SENDGRID_PASSWORD: process.env.SENDGRID_PASSWORD,
  SENDGRID_SENDER: process.env.SENDGRID_SENDER,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI
};
