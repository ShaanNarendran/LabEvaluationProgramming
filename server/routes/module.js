const express = require("express");
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/auth');

// POST /api/module - Create a new module
router.post("/", protect, authorize('faculty', 'admin'), moduleController.createModule);

// GET /api/module - Get all modules for the logged-in faculty
router.get("/", protect, authorize('faculty', 'admin'), moduleController.getAllModules);

// GET /api/module/:id - Get a specific module by ID
router.get("/:id", protect, authorize('faculty', 'admin'), moduleController.getModuleById);

// PUT /api/module/:id - Update a module
router.put("/:id", protect, authorize('faculty', 'admin'), moduleController.updateModule);

// DELETE /api/module/:id - Delete a module
router.delete("/:id", protect, authorize('faculty', 'admin'), moduleController.deleteModule);

module.exports = router;