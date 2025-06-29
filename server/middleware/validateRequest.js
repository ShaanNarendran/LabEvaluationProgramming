// middleware/validateRequest.js

const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, send them back
    return res.status(400).json({ errors: errors.array() });
  }
  next(); // No errors? Move to the next middleware/controller
};

module.exports = validateRequest;
