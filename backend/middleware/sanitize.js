const xss = require('xss');

const sanitizeString = (value) => {
  if (typeof value === 'string') {
    return xss(value);
  }
  return value;
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
};

module.exports = { sanitizeBody };
