const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: {
  type: String,
  default: null,
  required: function () {
    return this.paymentStatus === 'success' && this.paymentMethod !== 'cod';
  }
},
  cartHash: { type: String, default: null }, 
  couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 }, 
 shippingAddress: {

    name: {
      type: String,
      required: true
    },

    mobile: {
      type: String,
      required: true
    },

    pincode: {
      type: Number,
      required: true
    },

    locality: {
      type: String,
      required: true
    },

    addressLine: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    state: {
      type: String,
      required: true
    },

    landmark: {
      type: String,
      default: null
    },

    addressType: {
      type: String,
      enum: ['home', 'work']
    }

  },
  deliveryCharge: {type: Number, default : 0},
  totalPrice: { type: Number, required: true },
platformFee: { type: Number, default: 7},

  orderStatus: { 
    type: String, 
    enum: [
      'payment_failed',
      'pending', 
      'confirmed', 
      'shipped', 
      'in-transit', 
      'delivered', 
      'cancelled', 
      'partially_fulfilled',
      'return_requested',
      'returned'
    ], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['wallet', 'upi', 'card', 'netbanking', 'cod', 'razorpay'], 
    default: null 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'success', 'failed','refunded'], 
    default: 'pending' 
  },
  returnReason: { type: String, default: null },
  orderDate: { type: Date, default: Date.now },
  returnDeclined: { type: Boolean, default: false },
  deliveryDate: { type: Date, default: null },
  expiresAt: {type: Date,default: null}
}, { timestamps: true });

// Add index to prevent duplicate failed orders for same cart
orderSchema.index({ user_id: 1, cartHash: 1 });

module.exports = mongoose.model('Order', orderSchema);
