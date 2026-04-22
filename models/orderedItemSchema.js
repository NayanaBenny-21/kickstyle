const mongoose = require('mongoose');

const orderedItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
  quantity: { type: Number, required: true },

  sku: { type: String, required: true },
  productName: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, default: null },
  basePrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  image: { type: String, required: true },
  rating: { type: Number, default: null },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    status: {
    type: String,
    enum: ["payment_failed","pending", "confirmed", "shipped", "in-transit", "delivered", "cancelled", "return_requested","returned"],
    default: "pending"
  },
    returnReason: { type: String, default: null },
     returnRefunded: {
    type: Boolean,
    default: false
  },

   deliveryDate: { type: Date, default: null }
}, { timestamps: true }); 
module.exports = mongoose.model('OrderedItem', orderedItemSchema);

