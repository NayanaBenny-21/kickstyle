const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Cart = require('../../models/cartSchema');

const validateCart = async (userId) => {
  const cart = await Cart.findOne({ user_id: userId })
    .populate("items.productId items.variantId");

  if (!cart || !cart.items.length) {
    return { error: "Cart is empty" };
  }

  const removedItems = [];
  const availableItems = [];

  for (const item of cart.items) {
    if (!item.productId || !item.productId.isActive) {
      removedItems.push(item.productId?.product_name || "Unknown Product");
      continue;
    }

    if (item.variantId) {
      const stockAvailable = await checkStock(item.variantId._id, item.quantity);
      if (!stockAvailable) {
        removedItems.push(item.productId.product_name);
      } else {
        availableItems.push(item);
      }
    } else {
      availableItems.push(item);
    }
  }

  // 🔴 Single item cart & out of stock
  if (cart.items.length === 1 && removedItems.length === 1) {
    return {
      singleItemOut: true,
      removedItems
    };
  }

  // 🔴 Multi item cart
  if (removedItems.length > 0) {
    await Cart.findByIdAndUpdate(cart._id, { items: availableItems });
    return {
      removedItems
    };
  }

  return {
    valid: true,
    cart,
    availableItems
  };
};
module.exports = {validateCart}