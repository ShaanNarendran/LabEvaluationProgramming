// server/models/module.js
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  courseCode: { type: String, required: true, trim: true, uppercase: true },
  weekNumber: { type: Number, required: true, min: 1 },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);
