const express = require('express');
const router = express.Router();
const placeholderController = require('../controllers/placeholderController');

// This route simulates the endpoint on the other team's server
// that you will post performance data to.
router.post('/update-performance', placeholderController.updatePerformance);

module.exports = router;