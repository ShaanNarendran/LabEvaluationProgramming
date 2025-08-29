const { Module } = require('../models');

// Create a new module
exports.createModule = async (req, res, next) => {
    try {
        const { title, courseCode, weekNumber, questions } = req.body;
        const newModule = new Module({
            title,
            courseCode,
            weekNumber,
            questions, // This should be an array of Question ObjectIds
            createdBy: req.user.id
        });
        await newModule.save();
        res.status(201).json(newModule);
    } catch (err) {
        next(err);
    }
};

// Get all modules created by the logged-in faculty
exports.getAllModules = async (req, res, next) => {
    try {
        const modules = await Module.find({ createdBy: req.user.id })
            .populate('questions', 'title description'); // Populate question details
        res.json(modules);
    } catch (err) {
        next(err);
    }
};

// Get a single module by its ID
exports.getModuleById = async (req, res, next) => {
    try {
        const module = await Module.findById(req.params.id).populate('questions');
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.json(module);
    } catch (err) {
        next(err);
    }
};

// Update a module
exports.updateModule = async (req, res, next) => {
    try {
        const { title, courseCode, weekNumber, questions } = req.body;
        const updatedModule = await Module.findByIdAndUpdate(req.params.id, {
            title,
            courseCode,
            weekNumber,
            questions
        }, { new: true });

        if (!updatedModule) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.json(updatedModule);
    } catch (err) {
        next(err);
    }
};

// Delete a module
exports.deleteModule = async (req, res, next) => {
    try {
        const module = await Module.findByIdAndDelete(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.json({ message: 'Module deleted successfully' });
    } catch (err) {
        next(err);
    }
};