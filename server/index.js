require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const testCases = require('./testCases');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/submit', async (req, res) => {
  const { source_code, language_id } = req.body;
  const results = [];

  for (const testCase of testCases) {
    try {
      const response = await axios.post(
        'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
        {
          source_code,
          language_id,
          stdin: testCase.input,
        },
        {
          headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
        }
      );

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: response.data.stdout,
        passed: response.data.stdout === testCase.expectedOutput,
        status: response.data.status.description,
      });

    } catch (err) {
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        passed: false,
        status: 'Error',
        error: err.message,
      });
    }
  }

  res.json({ results });
});

app.listen(5000, () => console.log("Backend running on port 5000"));