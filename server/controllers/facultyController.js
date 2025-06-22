const { validationResult } = require('express-validator');
const Question = require("../models/question");
const Submission = require("../models/submission");
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');

// Get all questions for the dashboard list
exports.getAllQuestions = async (req, res, next) => {
    try {
        const questions = await Question.find().select('-testCases'); // Hide test cases from the general list
        res.json(questions);
    } catch (err) {
        next(err);
    }
};

// --- NEW: Get a single question's details by its ID ---
exports.getQuestionById = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json(question);
    } catch (err) {
        next(err);
    }
};

// --- RESTORED: Create a single new question ---
exports.createQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newQuestion = new Question({
            title: req.body.title,
            description: req.body.description,
            functionSignature: req.body.functionSignature,
            precode: req.body.precode,
            languages: req.body.languages,
            testCases: req.body.testCases
        });
        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (err) {
        next(err);
    }
};

// --- RESTORED: Delete a question ---
exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// --- RESTORED: Bulk upload questions from a file ---
exports.bulkUploadQuestions = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const questions = data.map(row => ({
            title: row.title,
            description: row.description,
            functionSignature: row.functionSignature,
            languages: row.languages.split(','),
            testCases: JSON.parse(row.testCases)
        }));

        await Question.insertMany(questions);
        res.status(201).json({ message: 'Bulk upload successful' });
    } catch (err) {
        next(err);
    }
};

// Get all submissions for a given question for the report page
exports.getQuestionReports = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ question: req.params.questionId })
      .populate('student', 'name roll_number')
      .sort({ submittedAt: -1 });
      
    res.json(submissions);
  } catch (err) {
    next(err);
  }
};