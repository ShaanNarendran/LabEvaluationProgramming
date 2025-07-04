const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

app.use(cors());
app.use(express.json());

//Correct static serve
app.use(express.static(path.join(__dirname, '../client')));

//API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/execute', require('./routes/execute'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/student', require('./routes/student'));
app.use('/api/placeholder', require('./routes/placeholder'));

//Explicit HTML routes
app.get('/faculty-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/faculty-login.html'));
});

app.get('/faculty-dashboard.html', (req, res) => {
  const filePath = path.join(__dirname, '..', 'client', 'faculty-dashboard.html');
  res.sendFile(filePath);
});

app.get('/faculty-report.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/faculty-report.html'));
});

app.get('/student-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/student-login.html'));
});

//Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

//DB + server start
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
