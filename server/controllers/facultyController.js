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

exports.bulkUploadQuestions = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    let questionsData = [];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    try {
        if (fileExtension === 'json') {
            // Handle JSON file
            const jsonData = JSON.parse(req.file.buffer.toString());
            // Ensure we have an array
            questionsData = Array.isArray(jsonData) ? jsonData : [];
        } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            // Handle Excel/CSV file
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            questionsData = xlsx.utils.sheet_to_json(sheet);
        } else {
            return res.status(400).json({ error: 'Unsupported file format. Please upload JSON or XLSX.' });
        }

        if (questionsData.length === 0) {
            return res.status(400).json({ error: 'No valid questions found in the uploaded file.' });
        }

        // Map the data to the Question schema, ensuring testCases are handled correctly
        const questions = questionsData.map(row => ({
            title: row.title,
            description: row.description,
            functionSignature: row.functionSignature,
            languages: Array.isArray(row.languages) ? row.languages : (String(row.languages || '').split(',').map(s => s.trim()).filter(Boolean)),
            testCases: Array.isArray(row.testCases) ? row.testCases : (JSON.parse(row.testCases || '[]'))
        }));

        await Question.insertMany(questions);
        res.status(201).json({ message: `${questions.length} questions uploaded successfully.` });

    } catch (err) {
        // Add more specific error logging
        console.error("Bulk Upload Error:", err);
        next(new Error(`Failed to process file. Error: ${err.message}`));
    }
};

// Get all submissions and question details for the report page
exports.getQuestionReports = async (req, res, next) => {
    try {
      const { questionId } = req.params;
  
      // Fetch both the question and submissions in parallel
      const [question, submissions] = await Promise.all([
          Question.findById(questionId).select('title description'),
          Submission.find({ question: questionId })
            .populate('student', 'name roll_number')
            .sort({ submittedAt: -1 })
      ]);
  
      if (!question) {
          return res.status(404).json({ message: 'Question not found' });
      }
  
      res.json({ question, submissions });
    } catch (err) {
      next(err);
    }
  };