const { Question, Submission } = require('../models');

// Fetches only the questions assigned to the logged-in student.
exports.getAllQuestions = async (req, res, next) => {
    try {
        // --- TEMPORARY DEBUGGING ---
        console.log(`[Debug] Fetching questions for user ID: ${req.user._id}`);
        // ---------------------------

        const questions = await Question.find({ assignedTo: req.user._id });

        // --- TEMPORARY DEBUGGING ---
        console.log(`[Debug] Found ${questions.length} questions for this user.`);
        // ---------------------------
        
        res.json(questions);
    } catch (err) {
        // --- TEMPORARY DEBUGGING ---
        console.error("[Debug] Error in getAllQuestions:", err);
        // ---------------------------
        next(err);
    }
};

// Fetches a single question by its ID.
exports.getQuestionById = async (req, res, next) => {
    try {
        const q = await Question.findById(req.params.id);
        if (!q) {
            return res.status(404).json({ error: "Question not found" });
        }
        res.json(q);
      } catch (err) {
        next(err);
      }
};

// Fetches all submissions made by the currently logged-in student.
exports.getSubmissions = async (req, res, next) => {
    try {
        const submissions = await Submission.find({ student: req.user._id }).select('question');
        res.json(submissions);
    } catch (err) {
        next(err);
    }
};
