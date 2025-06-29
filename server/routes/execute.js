const validateRequest = require('../middleware/validateRequest');
const express = require('express');
const { body } = require('express-validator');
const executionController = require('../controllers/executionController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Validation rules for both run and submit
const executionValidationRules = [
  body('language').not().isEmpty().withMessage('Language is required.'),
  body('code').not().isEmpty().withMessage('Source code cannot be empty.'),
  body('questionId').isMongoId().withMessage('A valid questionId is required.')
];

// Route for final submission (records the result)
router.post('/runCode',
  protect,
  executionValidationRules,
  validateRequest,  
  executionController.runCode
);

// NEW: Route for test runs (does NOT record the result)
router.post('/run',
  protect,
  executionValidationRules,
  validateRequest,
  executionController.runTestCases
);

module.exports = router;
