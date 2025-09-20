const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
const cookieParser = require('cookie-parser');
const { protectPage, authorize } = require('./middleware/auth');
require('dotenv').config({ path: __dirname + '/.env' });

// Fix mongoose deprecation warning
mongoose.set('strictQuery', false);

const app = express();

const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/execute', require('./routes/execute'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/student', require('./routes/student'));
app.use('/api/module', require('./routes/module'));
// The placeholder route that was here is now removed.

// Public HTML Routes
app.get('/faculty-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/faculty-login.html'));
});
app.get('/student-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/student-login.html'));
});

// Secured HTML Routes
app.get('/admin-dashboard.html', noCache, protectPage('/student-login.html'), authorize('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin-dashboard.html'));
});
app.get('/faculty-dashboard.html', noCache, protectPage('/faculty-login.html'), authorize('faculty', 'admin'), (req, res) => {
  res.sendFile(path.join(__dirname, '../client/faculty-dashboard.html'));
});
app.get('/faculty-report.html', noCache, protectPage('/faculty-login.html'), authorize('faculty', 'admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../client/faculty-report.html'));
});
app.get(['/', '/index.html'], noCache, protectPage('/student-login.html'), authorize('student'), (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// DB + Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });