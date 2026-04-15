const logger = require('../config/logger');

const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    logger.info(`Contact form submission from ${name} (${email})`);

    res.status(201).json({
      message: 'Thank you for your message! We will get back to you within 24 hours.',
      submission: {
        name,
        email,
        message,
        submittedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
};

module.exports = { submitContact };
