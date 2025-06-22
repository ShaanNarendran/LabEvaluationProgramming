// This is the correct way to import a specific function from a module
const { executeCode } = require('../util/dockerRunner');

const Question = require('../models/question');
const Submission = require('../models/submission');
const axios = require('axios');

const PERFORMANCE_UPDATE_URL = 'http://localhost:5050/api/placeholder/update-performance';

/**
 * Handles the final submission of code, runs against all test cases,
 * and saves the result to the database.
 */
exports.runCode = async (req, res, next) => {
  const { language, code, questionId } = req.body;
  
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { _id: studentId, user_id } = req.user;

  try {
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // This call will now work as intended.
    const { stdout, stderr } = await executeCode(language, code, question.testCases);

    const passed = !stderr && question.testCases.every((testCase, index) => {
      return stdout[index]?.trim() === testCase.expected.trim();
    });

    const submission = new Submission({
      question: questionId,
      student: studentId,
      code: code,
      output: stderr || stdout.join('\n'),
      passed: passed
    });
    await submission.save();

    // --- Placeholder API Call ---
    try {
      console.log(`Sending performance update for student: ${user_id}...`);
      await axios.post(PERFORMANCE_UPDATE_URL, {
        studentId: user_id,
        questionId: question._id,
        passed: passed,
        submittedAt: submission.submittedAt
      });
      console.log('Performance update sent successfully to placeholder API.');
    } catch (apiError) {
      console.error('Failed to send performance update to placeholder API:', apiError.message);
    }
    
    res.json({ stdout, stderr, submission });

  } catch (error) {
    next(error);
  }
};


/**
 * Handles a test run of the code.
 * Runs only against VISIBLE test cases and does NOT save to the database.
 */
exports.runTestCases = async (req, res, next) => {
    const { language, code, questionId } = req.body;

    try {
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const visibleTestCases = question.testCases.filter(tc => !tc.hidden);
        
        // This call will now work correctly
        const { stdout, stderr } = await executeCode(language, code, visibleTestCases);

        res.json({ stdout, stderr });

    } catch (error) {
        next(error);
    }
};
