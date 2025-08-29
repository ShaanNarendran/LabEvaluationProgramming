const express = require('express');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const logAction = require('../util/logAction');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const allowedBatches = ['N', 'P', 'Q'];

router.post('/register/individual', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, user_id, password, role, roll_number, batch, semester } = req.body;

        if (!['faculty', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const existingUser = await User.findOne({
            $or: [
                { user_id },
                { roll_number }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.user_id === user_id
                    ? 'User already exists'
                    : 'Roll number already exists'
            });
        }
        const userData = {
            name,
            user_id,
            roll_number,
            password,
            role
        };

        if (role === 'student') {
            if (batch) {
                if (!allowedBatches.includes(batch)) {
                    return res.status(400).json({ message: 'Invalid batch' });
                }
                userData.batch = batch;
            }

            if (semester) {
                userData.semester = semester;
            }
        }

        const user = new User(userData);
        await user.save();

        let actionDetails = `Created user ${user.user_id} (${role})`;
        if (role === 'student' && user.batch) {
            const batchName = allowedBatches.includes(user.batch) ? user.batch : 'Unknown batch';
            actionDetails += ` assigned to batch ${batchName}, semester ${user.semester || 1}`;
        }

        await logAction({
            user_id: req.user.user_id || 'system',
            action: 'create_user',
            details: actionDetails
        });

        const response = {
            message: 'User registered successfully',
            user: {
                _id: user._id,
                name: user.name,
                roll_number: user.roll_number,
                user_id: user.user_id,
                role: user.role
            }
        };

        if (role === 'student') {
            response.user.batch = user.batch;
            response.user.semester = user.semester || 1;
        }

        return res.status(201).json(response);

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Error registering user' });
    }
});

router.post('/register/bulk', protect, authorize('admin'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let parsedUsers = [];

    try {
        if (!['xlsx', 'xls', 'csv', 'json', 'pdf'].includes(ext)) {
            return res.status(400).json({ message: 'Unsupported file format' });
        }

        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            parsedUsers = xlsx.utils.sheet_to_json(sheet);
        }

        else if (ext === 'json') {
            const jsonData = JSON.parse(req.file.buffer.toString());
            parsedUsers = Array.isArray(jsonData) ? jsonData : jsonData.users || [];

            if (!Array.isArray(parsedUsers)) {
                return res.status(400).json({
                    message: 'Invalid JSON format. Expected an array of users or an object with a users array'
                });
            }
        }
        else if (ext === 'pdf') {
            const dataBuffer = req.file.buffer;
            const pdfData = await pdfParse(dataBuffer);
            const text = pdfData.text;

            const lines = text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.toLowerCase().includes('name'))

            const parsed = [];

            for (const line of lines) {
                let cleaned = line.replace(/\s{2,}/g, ',');

                if ((cleaned.match(/,/g) || []).length < 4) {
                    cleaned = line.replace(/\s+/g, ',');
                }
                
                const [name, user_id, roll_number, password, role] = cleaned.split(',').map(x => x?.trim());

                if (!name || !user_id || !roll_number || !password || !role) {
                    console.warn(`Skipping malformed line: "${line}"`);
                    continue;
                }

                if (!['student', 'faculty'].includes(role.toLowerCase())) {
                    console.warn(`Invalid role: "${role}"`);
                    continue;
                }

                parsed.push({ name, user_id, roll_number, password, role: role.toLowerCase() });
            }

            parsedUsers = parsed;
        }

        if (!parsedUsers || parsedUsers.length === 0) {
            return res.status(400).json({ message: 'No valid users found in file' });
        }

        const createdUsers = [];
        const errors = [];

        for (const entry of parsedUsers) {
            const { name, user_id, roll_number, password, role, batch, semester } = entry;

            if (!name || !user_id || !roll_number || !password || !['student', 'faculty'].includes(role)) {
                errors.push({ user_id, message: 'Invalid or missing fields' });
                continue;
            }

            const existing = await User.findOne({
                $or: [{ user_id }, { roll_number }]
            });
            if (existing) {
                errors.push({ user_id, message: existing.user_id === user_id ? 'User already exists' : 'Roll number already exists' });
                continue;
            }

            const userData = { name, user_id, roll_number, password, role };

            if (role === 'student') {
                if (batch) {
                    if (!allowedBatches.includes(batch)) {
                        errors.push({ user_id, message: 'Invalid batch' });
                        continue;
                    }
                    userData.batch = batch;
                }
                if (semester) {
                    userData.semester = semester;
                }
            }

            const newUser = new User(userData);
            await newUser.save();

            await logAction({
                user_id: req.user.user_id || 'system',
                action: 'create_user',
                details: `Bulk created user ${newUser.user_id} (${role})${userData.batch ? ` assigned to batch ${userData.batch}` : ''}${userData.semester ? `, semester ${userData.semester}` : ''}`
            });
            createdUsers.push({ name: newUser.name, user_id: newUser.user_id, roll_number: newUser.roll_number, role: newUser.role, batch: newUser.batch, semester: newUser.semester });
        }

        return res.status(207).json({
            message: 'File processed',
            created: createdUsers,
            errors
        });

    } catch (error) {
        console.error('Error processing file:', error);
        return res.status(500).json({ message: 'Failed to process file' });
    }
});

router.post('/login', async (req, res) => {
    const { user_id, password } = req.body;

    const user = await User.findOne({ user_id });
    if (!user) {
        await logAction({
            user_id: user_id,
            action: 'login_attempt',
            details: 'Failed login: invalid user_id',
            ip: req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress,
            system_id: req.body.system_id || req.headers['user-agent']
        });
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        await logAction({
            user_id: user_id,
            action: 'login_attempt',
            details: 'Failed login: invalid password',
            ip: req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress,
            system_id: req.body.system_id || req.headers['user-agent']
        });
        return res.status(401).json({ message: 'Invalid credentials' });
    }
   
    const ip = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress || '';
    const system_id = req.body.system_id || req.headers['user-agent'] || 'unknown';

    const sessionToken = uuidv4();
    user.session_token = sessionToken;
    await user.save();

    const token = jwt.sign(
        { id: user._id, user_id: user.user_id, role: user.role, session_token: sessionToken },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    await logAction({
        user_id: user.user_id,
        action: 'login',
        details: `User logged in from IP: ${ip}, System: ${system_id}`,
        ip,
        system_id
    });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        _id: user._id,
        name: user.name,
        user_id: user.user_id,
        roll_number: user.roll_number,
        role: user.role,
    });
});

// Get all users
router.get('/get_users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Update user
router.put('/update/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const updateFields = { ...req.body };
        const allowedFields = ['name', 'user_id', 'roll_number', 'role', 'batch', 'semester', 'handledBatches'];
        Object.keys(updateFields).forEach(key => {
            if (!allowedFields.includes(key)) {
                delete updateFields[key];
            }
        });

        if (updateFields.batch && !allowedBatches.includes(updateFields.batch)) {
            return res.status(400).json({ message: 'Invalid batch' });
        }

        if (updateFields.role && updateFields.role !== 'student') {
            updateFields.batch = undefined;
            updateFields.semester = undefined;
            updateFields.roll_number = undefined;
        }

        if (updateFields.role && updateFields.role !== 'faculty') {
            updateFields.handledBatches = [];
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');
        
        await logAction({
            user_id: req.user.user_id || 'system',
            action: 'update_user',
            details: `Updated user ${user.user_id} (${user.role})`
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

// Delete user
router.delete('/delete/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await logAction({
            user_id: req.user.user_id || 'system',
            action: 'delete_user',
            details: `Deleted user with ID ${user.user_id})`
        });
        res.json({ message: `User ${user.user_id} deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

router.post('/logout', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.session_token = null;
        await user.save();

        await logAction({
            user_id: user.user_id,
            action: 'logout',
            details: 'User logged out and session_token cleared'
        });
        
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Logout failed' });
    }
});

module.exports = router;