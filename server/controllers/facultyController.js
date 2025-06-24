const { validationResult } = require('express-validator');
const Question = require("../models/question");
const Submission = require("../models/submission");
const User = require("../models/user");
const xlsx = require('xlsx');

// Helper function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

exports.getAllQuestions = async (req, res, next) => {
    try {
        const questions = await Question.find().select('-testCases');
        res.json(questions);
    } catch (err) {
        next(err);
    }
};

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

exports.createQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const newQuestion = new Question({
            ...req.body,
            createdBy: req.user.id
        });
        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (err) {
        next(err);
    }
};

exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        await Submission.deleteMany({ question: req.params.id });
        res.json({ message: 'Question and its submissions deleted successfully' });
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
            questionsData = JSON.parse(req.file.buffer.toString());
        } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            questionsData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        } else {
            return res.status(400).json({ error: 'Unsupported file format.' });
        }
        
        const questions = questionsData.map(row => ({ ...row, createdBy: req.user.id }));
        await Question.insertMany(questions);
        res.status(201).json({ message: `${questions.length} questions uploaded successfully.` });
    } catch (err) {
        next(new Error(`Failed to process file: ${err.message}`));
    }
};

exports.getQuestionReports = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const [question, submissions] = await Promise.all([
        Question.findById(questionId).select('title description'),
        Submission.find({ question: questionId }).populate('student', 'name roll_number').sort({ submittedAt: -1 })
    ]);
    if (!question) {
        return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ question, submissions }); 
  } catch (err) {
    next(err);
  }
};

// --- FINAL CORRECTED ASSIGNMENT LOGIC ---
exports.assignQuestions = async (req, res, next) => {
    const { questionIds, batch, strategy, count } = req.body;

    if (!questionIds || questionIds.length === 0 || !batch || !strategy) {
        return res.status(400).json({ message: 'Question IDs, batch, and strategy are required.' });
    }

    try {
        console.log(`[Assign] Starting assignment for batch '${batch}' with strategy '${strategy}'.`);
        
        const students = await User.find({ role: 'student', batch: batch });
        if (students.length === 0) {
            return res.status(404).json({ message: `No students found for batch '${batch}'.` });
        }
        const studentIds = students.map(s => s._id);
        console.log(`[Assign] Found ${studentIds.length} students for batch '${batch}'.`);

        // First, clear any of these students from the selected questions to ensure a clean slate
        await Question.updateMany(
            { _id: { $in: questionIds } },
            { $pull: { assignedTo: { $in: studentIds } } }
        );
        console.log(`[Assign] Cleared previous assignments for ${questionIds.length} questions.`);

        let totalModified = 0;

        if (strategy === 'manual') {
            console.log(`[Assign] Manual strategy: Assigning ${questionIds.length} questions to all students.`);
            const result = await Question.updateMany(
                { _id: { $in: questionIds } },
                { $addToSet: { assignedTo: { $each: studentIds } } }
            );
            console.log('[Assign] Manual update result:', result);
            totalModified = result.modifiedCount;

        } else if (strategy === 'random') {
            console.log(`[Assign] Random strategy: Assigning ${count} of ${questionIds.length} questions to each student.`);
            for (const student of students) {
                const shuffledQuestions = shuffleArray([...questionIds]);
                const questionsToAssign = shuffledQuestions.slice(0, count);
                
                const result = await Question.updateMany(
                    { _id: { $in: questionsToAssign } },
                    { $addToSet: { assignedTo: student._id } }
                );
                totalModified += result.modifiedCount;
            }
        }

        console.log(`[Assign] Database operation finished. Total documents modified: ${totalModified}`);
        res.status(200).json({ message: `Assignment completed for batch ${batch}.` });

    } catch (err) {
        console.error("[Assign] An error occurred:", err);
        next(err);
    }
};