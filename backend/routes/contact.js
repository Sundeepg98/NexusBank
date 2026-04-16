const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { submitContact } = require('../controllers/contactController');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: { error: 'Too many contact submissions, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/', contactLimiter, submitContact);

module.exports = router;
