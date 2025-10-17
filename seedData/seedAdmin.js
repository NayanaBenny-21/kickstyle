// seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/adminSchema');

mongoose.connect('mongodb://127.0.0.1:27017/kickstyle')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword
    });

    await admin.save();
    console.log('Admin created successfully!');
  } catch (err) {
    console.error('Error creating admin:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
