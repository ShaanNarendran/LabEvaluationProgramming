const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  functionSignature: { type: String },
  precode: { type: String },
  languages: [String],
  testCases: [{
    input: { type: String, default: '' },
    expected: { type: String, default: '' }
  }],
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model("Question", questionSchema);