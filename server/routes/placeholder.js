const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validateRequest = require('../middleware/validateRequest');

const placeholderController = require('../controllers/placeholderController');

const updatePerformanceValidation = [
  body('studentId').not().isEmpty().withMessage('studentId is required.'),
  body('questionId').isMongoId().withMessage('Valid questionId is required.'),
  body('score').isNumeric().withMessage('Score must be a number.')
];

router.post(
  '/update-performance',
  updatePerformanceValidation,
  validateRequest,
  placeholderController.updatePerformance
);
router.post('/update-performance', placeholderController.updatePerformance);

module.exports = router;