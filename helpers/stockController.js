const Product = require('../models/productSchema');
const Variant = require('../models/variantSchema');
const OrderedItem = require('../models/orderedItemSchema');
async function decreaseStock(variantId, quantity) {
  try {
    if (!variantId) return console.log('No variantId provided');

    const variant = await Variant.findById(variantId);
    if (!variant) return console.log('Variant not found:', variantId);

    const qty = Number(quantity) || 0;
    variant.stock = Math.max(variant.stock - qty, 0);
    await variant.save();

    const variants = await Variant.find({ product_id: variant.product_id });
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    await Product.findByIdAndUpdate(variant.product_id, { total_stock: totalStock });

    console.log(`Variant ${variant._id} stock decreased by ${qty}. Total stock: ${totalStock}`);
  } catch (err) {
    console.error('Error decreasing stock:', err);
  }
}


async function increaseStock(variantId, qty) {
try {
    const variant = await Variant.findById(variantId);
    if (!variant) return;

    variant.stock += qty;
    await variant.save();

    const variants = await Variant.find({ product_id: variant.product_id });
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    await Product.findByIdAndUpdate(variant.product_id, { total_stock: totalStock });
  } catch (err) {
    console.error("Error restoring stock:", err);
  }
}


module.exports = { decreaseStock, increaseStock };

