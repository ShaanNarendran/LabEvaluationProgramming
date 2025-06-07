function runCode() {
    const code = document.getElementById('code').value;
  
    axios.post('http://localhost:5000/submit', {
      source_code: code,
      language_id: 71  // Python 3
    }).then(res => {
      const results = res.data.results;
      let outputText = "";
      results.forEach((r, i) => {
        outputText += `Test Case ${i + 1}:\n`;
        outputText += `Expected: ${r.expectedOutput}`;
        outputText += `Actual: ${r.actualOutput}`;
        outputText += `Status: ${r.passed ? "✅ Passed" : "❌ Failed"}\n\n`;
      });
      document.getElementById('output').textContent = outputText;
    }).catch(err => {
      console.error(err);
      document.getElementById('output').textContent = "Error running code.";
    });
  }