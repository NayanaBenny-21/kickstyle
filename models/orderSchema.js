const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionHistory', required: true },
  couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  shippingAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  totalPrice: { type: Number, required: true },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['wallet', 'upi', 'card', 'netbanking'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'success', 'failed'], 
    default: 'pending' 
  },
  returnReason: { type: String, default: null },
  orderDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date, default: null }
}, { timestamps: true }); 
module.exports = mongoose.model('Order', orderSchema);
