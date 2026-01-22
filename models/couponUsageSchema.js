const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coupon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  usedAt: { type: Date, default: Date.now }
},{ timestamps: true });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
