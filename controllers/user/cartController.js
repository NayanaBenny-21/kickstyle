const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const { applyBestOfferToProduct } = require("../../helpers/offerHelper");


// ----- ADD TO CART -----
const addToCart = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'User not found' });

  const { productId, variantId, quantity } = req.body;
   console.log("🟦 Add to Cart Request Body:", req.body); 
  if (!productId || !variantId || !quantity)
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  if (!variantId) return res.json({ success: false, message: "Variant not selected" });

  const qty = parseInt(quantity, 10);
  const maxQty = 5;

  try {
    let product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
if (!product.isActive) {
  return res.json({
    success: false,
    message: "This product is currently unavailable",
    unlisted: true
  });
}

    const variant = await Variant.findById(variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    if (variant.stock <= 0) {
      return res.json({ success: false, message: 'This variant is out of stock', outOfStock: true });
    }

    if (qty > variant.stock) {
      return res.json({
        success: false,
        message: `Only ${variant.stock} item(s) available`,
        outOfStock: true
      });
    }
   product = await applyBestOfferToProduct(product); 
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) cart = new Cart({ user_id: userId, items: [] });

    const existingIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.variantId.toString() === variantId
    );

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > maxQty) {
        return res.json({ success: false, message: `You can only add max ${maxQty} of this product` });
      }
      if (newQty > variant.stock) {
        return res.json({ success: false, message: `Only ${variant.stock} item(s) available` });
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.final_price;
      cart.items[existingIndex].totalPrice = product.final_price * newQty;
    } else {
      cart.items.push({ productId, variantId, quantity: qty, price: product.final_price, totalPrice: product.final_price * qty  });
    }

    await cart.save();

    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return res.json({ success: true, message: 'Added to cart', cartCount });

  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ----- LOAD CART -----
const loadCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) return res.redirect('/auth/login');

    const cart = await Cart.findOne({ user_id: userId })
      .populate({ path: 'items.productId', select: 'product_name brand images isActive' })
      .populate({ path: 'items.variantId', select: 'size color image' });

    if (!cart || cart.items.length === 0)
      return res.render('user/cart', { cartItems: [] });

 const originalCount = cart.items.length;

    cart.items = cart.items.filter(item => {
      const product = item.productId;
      const variant = item.variantId;

      return (
        product &&                  
        product.isActive === true &&   
        variant                       
      );
    });

    // Save only if something was removed
    if (cart.items.length !== originalCount) {
      await cart.save();
    }

    let subTotal = 0;
    const cartItems = cart.items.map(item => {
      const product = item.productId;
      const variant = item.variantId;

      // Use the price stored in cart (with the best offer)
      const totalPrice = item.price * item.quantity;
      subTotal += totalPrice;

      const displayImage = variant?.image || product?.images?.[0] || '/images/default.png';

      return {
        _id: product._id,
        name: product.product_name,
        variantId: variant?._id,
        brand: product.brand,
        image: displayImage,
        size: variant?.size,
        color: variant?.color,
        quantity: item.quantity,
        price: item.price,      
        totalPrice
      };
    });

    const shippingCharge = subTotal >= 1000 ? 0 : 40;
    const platformFee = 7;
    const total = subTotal + shippingCharge + platformFee;

    return res.render('user/cart', { cartItems, subTotal, shippingCharge, platformFee, total });

  } catch (err) {
    console.error('Error loading cart:', err);
    return res.status(500).send('Something went wrong while loading the cart.');
  }
};

// ----- UPDATE QUANTITY -----
const updateQuantity = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) return res.json({ success: false, message: 'User not found' });

    const { productId, variantId, quantity } = req.body;
    const qty = parseInt(quantity, 10);
    if (!productId || !variantId || !qty || qty < 1) 
      return res.json({ success: false, message: 'Invalid request' });

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.json({ success: false, message: 'Cart not found' });

    const item = cart.items.find(
      i => i.productId.toString() === productId && i.variantId.toString() === variantId
    );
    if (!item) return res.json({ success: false, message: 'Item not found in cart' });

    // Fetch product & variant
  let product = await Product.findById(productId);
    const variant = await Variant.findById(variantId);
    if (!product || !variant) return res.json({ success: false, message: 'Product or variant not found' });
if (!product.isActive) {
  return res.json({
    success: false,
    message: "This product is currently unavailable",
    unlisted: true
  });
}
    // Check stock & max limit
    const maxAllowed = Math.min(variant.stock, 5);
    if (qty > maxAllowed) return res.json({
      success: false,
      limitError: true,
      message: `Only ${maxAllowed} item(s) available`
    });
product = await applyBestOfferToProduct(product);
    // Update quantity, price AND totalPrice
    item.quantity = qty;
    item.price = product.final_price;
    item.totalPrice = product.final_price * qty; // <-- NEW: store price*qty in DB

    // Mark items array as modified because of _id: false
    cart.markModified('items');
    await cart.save();

    // Recalculate totals for frontend
    let subTotal = 0;
    cart.items.forEach(ci => {
      subTotal += ci.totalPrice; // <-- use totalPrice now
    });

    const shippingCharge = subTotal >= 1000 ? 0 : 40;
    const platformFee = 7;
    const total = subTotal + shippingCharge + platformFee;

    console.log("Updated cart:", cart.items.map(i => ({
      productId: i.productId.toString(),
      variantId: i.variantId.toString(),
      qty: i.quantity,
      price: i.price,
      totalPrice: i.totalPrice
    })));

    return res.json({
      success: true,
      message: 'Quantity updated successfully',
      quantity: item.quantity,
      itemTotal: item.totalPrice, // <-- use totalPrice
      subTotal,
      shippingCharge,
      platformFee,
      total
    });

  } catch (err) {
    console.error('Error updating cart quantity:', err);
    return res.json({ success: false, message: 'Server error while updating quantity' });
  }
};



// ----- REMOVE ITEM -----
const removeItem = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) return res.json({ success: false, message: 'User not found' });

    const { productId, variantId } = req.body;
    if (!productId || !variantId)
      return res.json({ success: false, message: 'Missing product or variant ID' });

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(
      i => !(i.productId.toString() === productId && i.variantId.toString() === variantId)
    );
    await cart.save();

    return res.json({ success: true, message: 'Item removed successfully' });

  } catch (err) {
    console.error('Error removing item:', err);
    return res.json({ success: false, message: 'Server error while removing item' });
  }
};

// ----- GET CART COUNT (AJAX-friendly) -----
const getCartCount = async (req, res) => {
  try {
    const userId = req.user?._id || req.session.userId;
    if (!userId) return res.json({ success: true, count: 0 }); // always JSON

    const cart = await Cart.findOne({ user_id: userId });
    const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    return res.json({ success: true, count });

  } catch (err) {
    console.error('Cart count error:', err);
    return res.json({ success: false, count: 0 });
  }
};

const checkStockBeforeOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ user_id: userId })
      .populate("items.variantId")
      .populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    let unlistedItems = [];
    let insufficientStock = [];

    for (let item of cart.items) {
      const product = item.productId;
      const variant = item.variantId;

      // 🔴 PRODUCT UNLISTED / INACTIVE
      if (!product || !product.isActive) {
        unlistedItems.push({
          productName: product?.product_name || "Unknown product"
        });
        continue;
      }

      // 🔴 STOCK ISSUE
      if (!variant || item.quantity > variant.stock) {
        insufficientStock.push({
          productName: product.product_name,
          requested: item.quantity,
          available: variant ? variant.stock : 0
        });
      }
    }

    // If any unlisted products
    if (unlistedItems.length > 0) {
      return res.json({
        success: false,
        unlisted: true,
        items: unlistedItems
      });
    }

    // If stock issues
    if (insufficientStock.length > 0) {
      return res.json({
        success: false,
        stockIssue: true,
        items: insufficientStock
      });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("checkStockBeforeOrder error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addToCart, loadCart, updateQuantity, removeItem, getCartCount, checkStockBeforeOrder };
