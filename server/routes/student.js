const express = require("express");
const router = express.Router();
const studentController = require('../controllers/studentController');

// Defines routes for student actions
router.get("/questions", studentController.getAllQuestions);
router.get("/question/:id", studentController.getQuestionById);

module.exports = router;