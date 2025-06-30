const express = require("express");
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect } = require('../middleware/auth'); 

// Defines routes for student actions
router.get("/questions", protect, studentController.getAllQuestions);

<<<<<<< HEAD
router.get("/question/:id", protect, studentController.getQuestionById); 

router.get("/submissions", protect, studentController.getSubmissions);

=======
router.get("/question/:id", studentController.getQuestionById); 

router.get("/submissions", protect, studentController.getSubmissions);
>>>>>>> 9cd1863b6d4920735ee8ef1f2662a51b642160a5
module.exports = router;
