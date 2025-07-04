// This controller simulates the other team's API for receiving performance updates.

exports.updatePerformance = (req, res) => {
  const { studentId, questionId, passed, submittedAt, marksObtained } = req.body;

  console.log('\x1b[32m%s\x1b[0m', '--- PLACEHOLDER API RECEIVED PERFORMANCE UPDATE ---');
  console.log({
    studentId,
    questionId,
    marksObtained,
    passed,
    submittedAt
  });
  console.log('\x1b[32m%s\x1b[0m', '-------------------------------------------------');

  // In a real scenario, this endpoint would update the main user database.
  // For now, it just confirms that it received the data correctly.
  res.status(200).json({ message: 'Performance update received successfully by placeholder.' });
};
