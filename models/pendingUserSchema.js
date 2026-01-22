const mongoose = require('mongoose');
const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  referralCode: String,
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});


const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
module.exports = PendingUser;
