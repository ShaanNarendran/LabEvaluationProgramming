const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user_id: { type: String, required: true, unique: true },
    roll_number: {
        type: String,
        required: function () {
            return this.role === 'student';
        },
        unique: true,
    },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'faculty', 'student'],
        default: 'student'
    },
    batch: {
        type: String,
        enum: ['N', 'P', 'Q'],
    },
    semester: { type: Number, min: 1, max: 8 },
    session_token: { type: String, default: null }
});


userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    if (update && update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
        this.setUpdate(update);
    }
    next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User', userSchema);