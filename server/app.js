const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

app.use(cors());
app.use(express.json());
mongoose.set('strictQuery', true);

// --- API Routes ---
// These are all correct and do not need to be changed.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/execute', require('./routes/execute'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/student', require('./routes/student'));
app.use('/api/placeholder', require('./routes/placeholder'));

// --- Static File Serving ---
// This serves assets like CSS, images, etc. from the client folder.
app.use(express.static(path.join(__dirname, '../client')));

// --- NEW: Explicit Routes for Main HTML Pages ---
// These routes tell the server exactly what file to send for each page.
app.get('/faculty-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/faculty-login.html'));
});

app.get('/faculty-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/faculty-dashboard.html'));
});

app.get('/faculty-report.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/faculty-report.html'));
});

app.get('/student-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/student-login.html'));
});

// --- Catch-all Route ---
// This now correctly handles the root path '/' (e.g., http://localhost:5050/)
// and any other unknown routes by sending them to the student dashboard.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// --- Database Connection and Server Start ---
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