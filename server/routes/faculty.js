<<<<<<< HEAD
const validateRequest = require('../middleware/validateRequest');
=======
>>>>>>> 9cd1863b6d4920735ee8ef1f2662a51b642160a5
const express = require("express");
const router = express.Router();
const { body, param } = require('express-validator');
const multer = require("multer");
const facultyController = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Validation rules for creating a question
const questionValidationRules = [
    body('title').not().isEmpty().withMessage('Title is required.').trim().escape(),
    body('description').not().isEmpty().withMessage('Description is required.').trim().escape(),
    body('languages').isArray({ min: 1 }).withMessage('At least one language must be specified.'),
    body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required.')
];

// All faculty routes, now pointing to a complete controller
router.get("/questions", protect, authorize('faculty'), facultyController.getAllQuestions);
<<<<<<< HEAD
router.post("/questions", protect, authorize('faculty'), questionValidationRules,validateRequest, facultyController.createQuestion);
=======
router.post("/questions", protect, authorize('faculty'), questionValidationRules, facultyController.createQuestion);
>>>>>>> 9cd1863b6d4920735ee8ef1f2662a51b642160a5
router.post("/bulk", protect, authorize('faculty'), upload.single("file"), facultyController.bulkUploadQuestions);
router.delete("/questions/:id", protect, authorize('faculty'), facultyController.deleteQuestion);
router.get('/reports/:questionId', protect, authorize('faculty'), facultyController.getQuestionReports);
router.get("/questions/:id", protect, authorize('faculty'), facultyController.getQuestionById);
router.post("/questions/assign", protect, authorize('faculty'), facultyController.assignQuestions);

module.exports = router;
