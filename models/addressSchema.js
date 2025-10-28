const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // foreign key
    name: { type: String, required: true },
  mobile: { type: String, required: true },
  pincode: { type: Number, required: true },
  locality: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  landmark: { type: String, default: null }, // optional
  addressType: { type: String, enum: ['home', 'work'], required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true }); 

module.exports = mongoose.model('Address', addressSchema);
