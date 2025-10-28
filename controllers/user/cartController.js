const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const mongoose = require('mongoose');

const addToCart = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'User not found' });

  const { productId, variantId, quantity } = req.body;
  const qty = parseInt(quantity, 10);

  // Identify missing fields
  const missingFields = [];
  if (!productId) missingFields.push("productId");
  if (!variantId) missingFields.push("variantId");
  if (!quantity) missingFields.push("quantity");

  if (missingFields.length > 0) {
    console.warn("Add to cart request missing:", missingFields.join(", "));
    return res.status(400).json({ 
      success: false, 
      message: `Missing fields: ${missingFields.join(", ")}` 
    });
  }

  try {
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) cart = new Cart({ user_id: userId, items: [] });

    const existingIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId && item.variantId.toString() === variantId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += qty;
    } else {
      cart.items.push({ productId, variantId, quantity: qty });
    }

    await cart.save();
    console.log(' Cart saved successfully for user:', userId);
    console.log(' Current cart items:', cart.items);

    return res.json({ success: true, message: 'Added to cart', cart });
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const loadCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.redirect('/auth/login');
    console.log("[DEBUG] User ID detected:", userId);
    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'product_name brand final_price images'
      })
      .populate({
        path: 'items.variantId',
        model: 'Variant',
        select: 'size color image'
      });

          console.log("🛒 [DEBUG] Cart found:", cart ? cart.items.length : "No cart found");
    // If no cart or empty cart
    if (!cart || cart.items.length === 0) {
      return res.render('user/cart', { cartItems: [] });
    }

    let subTotal = 0;

    const cartItems = cart.items.map(item => {
      const product = item.productId;
      const variant = item.variantId;
      const displayImage = variant?.image || product?.images?.main || product?.images?.[0] 
      const totalPrice = product.final_price * item.quantity;
      subTotal += totalPrice;

      return {
        _id: product._id,
        name: product.product_name,
        variantId: variant?._id,
        brand: product.brand,
        image: displayImage,
        size: variant?.size,
        color: variant?.color,
        quantity: item.quantity,
        price: product.final_price,
        totalPrice
      };
    });

    const shippingCharge = subTotal > 1000 ? 0 : 40;
    const platformFee = 7;
    const total = subTotal + shippingCharge + platformFee;

    return res.render('user/cart', {
      cartItems,
      subTotal,
      shippingCharge,
      platformFee,
      total
    });

  } catch (error) {
    console.error('Error on loading cart:', error);
    return res.status(500).send('Something went wrong while loading the cart.');
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: "User not found" });

    const { productId, variantId, quantity } = req.body;

    if (!productId || !variantId || !quantity)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(i =>
        i.productId.toString() === productId && i.variantId.toString() === variantId
    );

    if (!item)
      return res.status(404).json({ success: false, message: "Item not found in cart" });

    // Update quantity
    item.quantity = quantity;

    await cart.save();
    console.log(`Updated quantity for user ${userId}: ${productId} (${variantId}) → ${quantity}`);

    res.json({ success: true, message: "Quantity updated successfully" });
  } catch (err) {
    console.error("Error updating cart quantity:", err);
    res.status(500).json({ success: false, message: "Server error while updating quantity" });
  }
};

const removeItem = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: "User not found" });

    const { productId, variantId } = req.body;

    if (!productId || !variantId)
      return res.status(400).json({ success: false, message: "Missing product or variant ID" });

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(i =>
        !(i.productId.toString() === productId && i.variantId.toString() === variantId)
    );

    await cart.save();
    console.log(`Removed item from cart: ${productId} (${variantId}) for user ${userId}`);

    res.json({ success: true, message: "Item removed successfully" });
  } catch (err) {
    console.error("Error removing cart item:", err);
    res.status(500).json({ success: false, message: "Server error while removing item" });
  }
};

module.exports = { addToCart, loadCart, updateQuantity, removeItem };
