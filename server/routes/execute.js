<<<<<<< HEAD
const validateRequest = require('../middleware/validateRequest');
=======
>>>>>>> 9cd1863b6d4920735ee8ef1f2662a51b642160a5
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
<<<<<<< HEAD
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
=======
router.post('/runCode', protect, executionValidationRules, executionController.runCode);

// NEW: Route for test runs (does NOT record the result)
router.post('/run', protect, executionValidationRules, executionController.runTestCases);

>>>>>>> 9cd1863b6d4920735ee8ef1f2662a51b642160a5

module.exports = router;
