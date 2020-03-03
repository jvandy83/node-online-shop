const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  sendgrid_user: process.env.SENDGRID_USER_NAME,
  sendgrid_password: process.env.SENDGRID_PASSWORD,
  sendgrid_sender: process.env.SENDGRID_SENDER,
  sendgrid_api_key: process.env.SENDGRID_API_KEY
}
