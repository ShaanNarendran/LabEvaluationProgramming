const mongoose = require('mongoose');
const User = require('./models/user'); // Make sure this path is correct
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for admin creation...');

    const adminExists = await User.findOne({ user_id: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists.');
      return;
    }

    const adminUser = new User({
      name: 'Admin',
      user_id: 'admin',
      roll_number: 'ADMIN001',
      password: 'a_secure_password', // Change this to a password of your choice
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

createAdmin();