const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerName: {
    type: String,
    required: true
  },
  offerType: {
    type: String,
    enum: ['product', 'category', 'referral'],
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },

  // Product Offer
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  // Category Offer
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },

  startDate: Date,
  endDate: Date,

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
