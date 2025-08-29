const { validationResult } = require('express-validator');
const { Question, Submission, User, Module } = require("../models");
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');

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

exports.assignQuestions = async (req, res, next) => {
    const { questionIds, batch, semester, strategy, count } = req.body;

    if (!questionIds || questionIds.length === 0 || !batch || !semester || !strategy) {
        return res.status(400).json({ message: 'Question IDs, batch, semester, and strategy are required.' });
    }

    try {
        const faculty = req.user;
        const isAuthorized = faculty.handledBatches.some(
            b => b.batch === batch && b.semester == semester
        );

        if (faculty.role !== 'admin' && !isAuthorized) {
            return res.status(403).json({ message: `You are not authorized to assign questions to Batch ${batch}, Semester ${semester}.` });
        }
        
        const students = await User.find({ role: 'student', batch: batch, semester: semester });
        if (students.length === 0) {
            return res.status(404).json({ message: `No students found for batch '${batch}', semester ${semester}.` });
        }
        const studentIds = students.map(s => s._id);

        await Question.updateMany(
            { _id: { $in: questionIds } },
            { $pull: { assignedTo: { $in: studentIds } } }
        );

        if (strategy === 'manual') {
            await Question.updateMany(
                { _id: { $in: questionIds } },
                { $addToSet: { assignedTo: { $each: studentIds } } }
            );
        } else if (strategy === 'random') {
            for (const student of students) {
                const shuffledQuestions = shuffleArray([...questionIds]);
                const questionsToAssign = shuffledQuestions.slice(0, count);
                
                await Question.updateMany(
                    { _id: { $in: questionsToAssign } },
                    { $addToSet: { assignedTo: student._id } }
                );
            }
        }

        res.status(200).json({ message: `Assignment completed for Batch ${batch}, Semester ${semester}.` });

    } catch (err) {
        console.error("[Assign Questions Error]", err);
        next(err);
    }
};

exports.assignModule = async (req, res, next) => {
    const { moduleId, batch, semester, randomCount } = req.body;

    if (!moduleId || !batch || !semester) {
        return res.status(400).json({ message: 'Module ID, batch, and semester are required.' });
    }

    try {
        const faculty = req.user;
        const isAuthorized = faculty.handledBatches.some(
            b => b.batch === batch && b.semester == semester
        );

        if (faculty.role !== 'admin' && !isAuthorized) {
            return res.status(403).json({ message: `You are not authorized to assign modules to Batch ${batch}, Semester ${semester}.` });
        }

        const module = await Module.findById(moduleId);
        if (!module || module.questions.length === 0) {
            return res.status(404).json({ message: "Module not found or is empty." });
        }

        const students = await User.find({ role: 'student', batch: batch, semester: semester });
        if (students.length === 0) {
            return res.status(404).json({ message: `No students found for Batch '${batch}', Semester ${semester}.` });
        }
        
        for (const student of students) {
            await Question.updateMany(
                {},
                { $pull: { assignedTo: student._id } }
            );

            let newAssignments = [];
            if (randomCount && randomCount > 0) {
                if (randomCount > module.questions.length) {
                    return res.status(400).json({ message: `Random count (${randomCount}) cannot be greater than the number of questions in the module (${module.questions.length}).` });
                }
                newAssignments = shuffleArray([...module.questions]).slice(0, randomCount);
            } else {
                newAssignments = module.questions;
            }

            if (newAssignments.length > 0) {
                await Question.updateMany(
                    { _id: { $in: newAssignments } },
                    { $addToSet: { assignedTo: student._id } }
                );
            }
        }
        
        const successMessage = randomCount > 0
            ? `Assigned ${randomCount} random questions from "${module.title}" to students.`
            : `Module "${module.title}" (all questions) assigned successfully.`;

        res.status(200).json({ message: successMessage });

    } catch (err) {
        console.error("[Assign Module Error]", err);
        next(err);
    }
};

// --- THIS IS THE UPDATED FUNCTION ---
exports.downloadModuleReport = async (req, res, next) => {
    try {
        const { moduleId } = req.params;
        const module = await Module.findById(moduleId).populate('questions', 'title marks');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
        
        const moduleQuestionIds = module.questions.map(q => q._id);

        // 1. Find all submissions for this module's questions
        const submissions = await Submission.find({ question: { $in: moduleQuestionIds } });
        
        // 2. Get the unique IDs of students who made these submissions
        const submittingStudentIds = [...new Set(submissions.map(s => s.student.toString()))];
        
        // 3. Fetch the user details for only those students
        const students = await User.find({ _id: { $in: submittingStudentIds } }).select('name roll_number');

        // --- PDF Generation ---
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${module.title.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // --- Helper function for drawing table rows ---
        function drawTableRow(y, c1, c2, c3, c4) {
            doc.fontSize(10).font('Helvetica')
                .text(c1, 50, y)
                .text(c2, 170, y)
                .text(c3, 290, y, { width: 160 })
                .text(c4, 470, y, { align: 'right' });
        }

        // --- PDF Content ---
        doc.fontSize(20).font('Helvetica-Bold').text(`Performance Report: ${module.title}`, { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`Course: ${module.courseCode} | Week: ${module.weekNumber}`, { align: 'center' });
        doc.moveDown(2);
        
        // Table Header
        let y = doc.y;
        doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
        doc.font('Helvetica-Bold');
        drawTableRow(y + 5, 'Student Name', 'Roll Number', 'Marks per Question', 'Total');
        y += 20;
        doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();

        // Table Rows
        for (const student of students) {
            let totalMarks = 0;
            let marksString = '';

            module.questions.forEach((q, index) => {
                const sub = submissions.find(s => s.student.equals(student._id) && s.question.equals(q._id));
                const marks = sub ? sub.marksAwarded : 0;
                totalMarks += marks;
                marksString += `Q${index + 1}: ${marks}/${q.marks}  `;
            });
            
            y += 5;
            drawTableRow(y, student.name, student.roll_number, marksString, totalMarks.toString());
            y += 20;
            doc.strokeColor("#e4e4e7").lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
        }

        doc.end();

    } catch (err) {
        next(err);
    }
};