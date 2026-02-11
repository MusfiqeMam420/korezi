const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // later you can switch provider
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
});

module.exports = transporter;
