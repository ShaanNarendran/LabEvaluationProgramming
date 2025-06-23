const express = require("express");
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect } = require('../middleware/auth'); 

// Defines routes for student actions
router.get("/questions", protect, studentController.getAllQuestions);

router.get("/question/:id", studentController.getQuestionById); 

module.exports = router;
