const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    title: { type: String, enum: ['topup', 'refund', 'order_payment'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
    payment_method: { type: String, enum: ['wallet', 'upi', 'card', 'netbanking'], required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    refund_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },
    transactionId: { type: String, unique: true, required: true }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);