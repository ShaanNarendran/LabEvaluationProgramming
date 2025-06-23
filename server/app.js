const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
mongoose.set('strictQuery', true); // Suppresses the deprecation warning

// --- API Routes ---
app.use('/api/auth', require('./routes/auth')); 
app.use('/execute', require('./routes/execute'));
app.use('/faculty', require('./routes/faculty'));
app.use('/student', require('./routes/student'));
app.use('/api/placeholder', require('./routes/placeholder')); 

app.use(express.static(path.join(__dirname, '../client')));

// --- Catch-all Route ---
// This route will catch any other GET request that hasn't been handled yet
// and send them the main index.html page. This is good practice for handling unknown URLs.
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