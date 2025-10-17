const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  product_name: { type: String, required: true },
  description: { type: String, required: true },
  brand: { type: String, required: true },
  images: {
    main: { type: String, required: true },         
    gallery: { type: [String], default: [] }        
  },
  base_price: { type: Number, required: true },
  final_price: { type: Number, required: true },
  discount_percentage: { type: Number, default: 0 },
  total_stock: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null } 
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdated' } });

module.exports = mongoose.model('Product', productSchema);
