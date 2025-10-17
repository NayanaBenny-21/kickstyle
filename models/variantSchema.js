const mongoose = require('mongoose');
const product = require('./productSchema');

const variantSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, unique: true, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  stock: { type: Number, required: true },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Variant = mongoose.model('Variant', variantSchema);

// Helper function to calculate total stock of a product
async function updateTotalStock(productId) {
  const totalStockSum = await Variant.aggregate([
    { $match: { product_id: productId } },
    { $group: { _id: null, total: { $sum: "$stock" } } }
  ]);

  const totalStock = totalStockSum[0]?.total || 0;
  await product.findByIdAndUpdate(productId, { total_stock : totalStock});
}
variantSchema.post('save', async function () {
  await updateTotalStock(this.product_id);
});
variantSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) await updateTotalStock(doc.product_id);
});

variantSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await updateTotalStock(doc.product_id);
});
// Export the model and helper function
module.exports = Variant;
