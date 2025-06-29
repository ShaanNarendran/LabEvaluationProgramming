const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// ✅ Make sure this path is correct!
const validateRequest = require('../middleware/validateRequest');

const placeholderController = require('../controllers/placeholderController');

// ✅ Validation rules for the data you expect
const updatePerformanceValidation = [
  body('studentId').not().isEmpty().withMessage('studentId is required.'),
  body('questionId').isMongoId().withMessage('Valid questionId is required.'),
  body('score').isNumeric().withMessage('Score must be a number.')
];

// ✅ This route now validates, then handles
router.post(
  '/update-performance',
  updatePerformanceValidation,
  validateRequest,
  placeholderController.updatePerformance
);

module.exports = router;