const { validationResult } = require('express-validator');
const Question = require("../models/question");
const Submission = require("../models/submission");
const User = require("../models/user"); // Ensure User model is required
const xlsx = require('xlsx');

// --- Helper function to shuffle an array ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// Get all questions for the dashboard list
exports.getAllQuestions = async (req, res, next) => {
    try {
        const questions = await Question.find().select('-testCases');
        res.json(questions);
    } catch (err) {
        next(err);
    }
};

// Get a single question's details by its ID
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

// Create a single new question
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

// Delete a question
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

// Bulk upload questions from a file
exports.bulkUploadQuestions = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    let questionsData = [];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    try {
        if (fileExtension === 'json') {
            const jsonData = JSON.parse(req.file.buffer.toString());
            questionsData = Array.isArray(jsonData) ? jsonData : [];
        } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
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
        console.error("Bulk Upload Error:", err);
        next(new Error(`Failed to process file. Error: ${err.message}`));
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


// --- UPDATED: Advanced Question Assignment Controller ---
exports.assignQuestions = async (req, res, next) => {
    const { questionIds, batch, strategy, count } = req.body;

    // --- Basic Validation ---
    if (!questionIds || questionIds.length === 0 || !batch || !strategy) {
        return res.status(400).json({ message: 'Question IDs, batch, and strategy are required.' });
    }
    if (strategy === 'random' && (!count || count < 1)) {
        return res.status(400).json({ message: 'A valid count is required for random assignment.' });
    }
    if (strategy === 'random' && count > questionIds.length) {
        return res.status(400).json({ message: 'Count cannot be greater than the number of selected questions.' });
    }

    try {
        // --- 1. Fetch Students ---
        const students = await User.find({ role: 'student', batch: batch });
        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found for this batch.' });
        }
        const studentIds = students.map(s => s._id);

        // --- 2. Clear Previous Assignments for this batch ---
        // This prevents students from accumulating questions over multiple assignment actions.
        const clearPromises = questionIds.map(qId => 
            Question.findByIdAndUpdate(qId, { $pull: { assignedTo: { $in: studentIds } } })
        );
        await Promise.all(clearPromises);


        // --- 3. Apply Assignment Strategy ---
        const assignmentPromises = [];

        if (strategy === 'manual') {
            // STRATEGY 1: Manual Assignment
            // Assign all selected questions to every student in the batch.
            students.forEach(student => {
                assignmentPromises.push(
                    Question.updateMany(
                        { _id: { $in: questionIds } },
                        { $addToSet: { assignedTo: student._id } }
                    )
                );
            });

        } else if (strategy === 'random') {
            // STRATEGY 2: Random Subset Assignment
            // For each student, shuffle the selected questions and assign them a random subset.
            students.forEach(student => {
                const shuffledQuestions = shuffleArray([...questionIds]);
                const questionsToAssign = shuffledQuestions.slice(0, count);
                
                assignmentPromises.push(
                    Question.updateMany(
                        { _id: { $in: questionsToAssign } },
                        { $addToSet: { assignedTo: student._id } }
                    )
                );
            });
        }

        // --- 4. Execute all database updates ---
        await Promise.all(assignmentPromises);

        res.status(200).json({ message: `Assignment successful for batch ${batch}.` });

    } catch (err) {
        next(err);
    }
};