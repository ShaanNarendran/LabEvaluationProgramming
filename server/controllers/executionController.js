const { executeCode } = require('../util/dockerRunner');
const { Question, Submission } = require('../models');

// The axios import and placeholder URL have been removed.

/**
 * Handles the final submission of code.
 */
exports.runCode = async (req, res, next) => {
  const { language, code, questionId } = req.body;
  
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { _id: studentId } = req.user;

  try {
    const existingSubmission = await Submission.findOne({ 
        student: studentId, 
        question: questionId 
    });

    if (existingSubmission) {
        return res.status(403).json({ error: 'You have already submitted an answer for this question.' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { stdout, stderr } = await executeCode(language, code, question.testCases);

    const passed = !stderr && question.testCases.every((testCase, index) => {
      const expectedOutput = testCase.expected.trim();
      const actualOutput = stdout[index]?.trim();
      return actualOutput === expectedOutput;
    });

    const marksToAward = passed ? question.marks : 0;

    const submission = new Submission({
      question: questionId,
      student: studentId,
      code: code,
      output: stderr || stdout.join('\n'),
      passed: passed,
      marksAwarded: marksToAward
    });
    await submission.save();

    // The entire block for sending the evaluation update to the placeholder has been removed.
    
    res.json({ stdout, stderr, submission });

  } catch (error) {
    next(error);
  }
};

/**
 * Handles a test run of the code. 
 */
exports.runTestCases = async (req, res, next) => {
  const { language, code } = req.body; 

  try {
      const customTestCases = [{ input: '' }];

      const { stdout, stderr } = await executeCode(language, code, customTestCases);
      
      res.json({ stdout, stderr });

  } catch (error) {
      next(error);
  }
};