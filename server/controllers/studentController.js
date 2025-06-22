const Question = require("../models/question");

// Fetches all questions for the student dashboard.
exports.getAllQuestions = async (req, res, next) => {
    try {
      const questions = await Question.find();
      res.json(questions);
    } catch (err) {
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