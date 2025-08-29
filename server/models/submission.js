const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  output: {
    type: String,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  testCaseResults: [{
    testCase: {
        input: String,
        expected: String
    },
    output: String,
    passed: Boolean
  }],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Submission', submissionSchema);
/*
{
  "studentId": "string",       // The unique ID of the student (e.g., "hpotter", "19CS001"). Provided by the Auth system.
  "questionId": "string",      // The globally unique, formatted ID for the question (e.g., "CS101-W02-Q03").
  "courseCode": "string",      // The code for the course (e.g., "CS101").
  "weekNumber": "number",      // The week number for the question.
  "marksObtained": "number",   // The marks the student received for this submission.
  "maxMarks": "number",        // The maximum possible marks for this question.
  "submittedAt": "ISOString",  // The timestamp of the submission in ISO 8601 format (e.g., "2025-06-27T18:30:00Z").
  "evaluationEngine": "string" // The name of the team/system that evaluated the submission (e.g., "PROGRAMMING_LAB", "OS_LAB").
}
  // --- Universal Virtual ID Generator ---
baseQuestionSchema.virtual('questionId').get(function() {
  const week = String(this.weekNumber).padStart(2, '0');
  const qNum = String(this.questionNumber).padStart(2, '0');
  return `${this.courseCode}-W${week}-Q${qNum}`;
});

  */
