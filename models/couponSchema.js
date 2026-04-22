const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponName: { type: String, required: true },
  description: { type: String },
  couponCode: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['flat', 'percentage'], required: true },
  discountValue: { type: Number, required: true }, 
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 0 },       
  perUserLimit: { type: Number, default: 0 },     
  usedCount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  terms: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null } 
}, { timestamps: true });
couponSchema.index({ couponName: 1 }, { unique: true, partialFilterExpression: { deleted: false } });
couponSchema.index({ couponCode: 1 }, { unique: true, partialFilterExpression: { deleted: false } });
module.exports = mongoose.model('Coupon', couponSchema);
