const validateRequest = require('../middleware/validateRequest');
const express = require("express");
const router = express.Router();
const { body, param } = require('express-validator');
const multer = require("multer");
const facultyController = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

const questionValidationRules = [
    body('title').not().isEmpty().withMessage('Title is required.').trim().escape(),
    body('description').not().isEmpty().withMessage('Description is required.').trim().escape(),
    body('languages').isArray({ min: 1 }).withMessage('At least one language must be specified.'),
    body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required.')
];

router.get("/my-batches", protect, authorize('faculty', 'admin'), (req, res) => {
    if (req.user.role === 'admin') {
        return res.json([
            { batch: 'N', semester: 1 }, { batch: 'P', semester: 1 }, { batch: 'Q', semester: 1 },
            { batch: 'N', semester: 2 }, { batch: 'P', semester: 2 }, { batch: 'Q', semester: 2 },
            { batch: 'N', semester: 3 }, { batch: 'P', semester: 3 }, { batch: 'Q', semester: 3 },
            { batch: 'N', semester: 4 }, { batch: 'P', semester: 4 }, { batch: 'Q', semester: 4 },
            { batch: 'N', semester: 5 }, { batch: 'P', semester: 5 }, { batch: 'Q', semester: 5 },
            { batch: 'N', semester: 6 }, { batch: 'P', semester: 6 }, { batch: 'Q', semester: 6 },
            { batch: 'N', semester: 7 }, { batch: 'P', semester: 7 }, { batch: 'Q', semester: 7 },
            { batch: 'N', semester: 8 }, { batch: 'P', semester: 8 }, { batch: 'Q', semester: 8 },
        ]);
    }
    res.json(req.user.handledBatches);
});

router.get("/questions", protect, authorize('faculty', 'admin'), facultyController.getAllQuestions);
router.post("/questions", protect, authorize('faculty', 'admin'), questionValidationRules, validateRequest, facultyController.createQuestion);
router.post("/bulk", protect, authorize('faculty', 'admin'), upload.single("file"), facultyController.bulkUploadQuestions);
router.delete("/questions/:id", protect, authorize('faculty', 'admin'), facultyController.deleteQuestion);
router.get('/reports/:questionId', protect, authorize('faculty', 'admin'), facultyController.getQuestionReports);
router.get("/questions/:id", protect, authorize('faculty', 'admin'), facultyController.getQuestionById);
router.post("/modules/assign", protect, authorize('faculty', 'admin'), facultyController.assignModule);
router.get('/modules/:moduleId/report', protect, authorize('faculty', 'admin'), facultyController.downloadModuleReport);
router.post("/questions/assign", protect, authorize('faculty', 'admin'), facultyController.assignQuestions);

module.exports = router;