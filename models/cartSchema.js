const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
    totalPrice: { type: Number, required: true } 
},{ _id: false });

const cartSchema = new mongoose.Schema({
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items :[cartItemSchema]
 }, { timestamps: true });

 module.exports = mongoose.model('Cart', cartSchema);
