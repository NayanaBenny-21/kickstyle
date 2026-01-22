const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, enum: ['Order Payment', 'Refund', 'Failed Payment'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  payment_method: { type: String, enum: ['upi', 'card', 'netbanking','razorpay'], required: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  refund_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },
  transactionId: { type: String, unique: true, required: true }
}, { timestamps: true });

module.exports = mongoose.model('TransactionHistory', transactionSchema);
