const Question = require("../models/question");

// Fetches assigned questions for the logged in student.
exports.getAllQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({ assignedTo: req.user._id });
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