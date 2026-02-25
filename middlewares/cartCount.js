const Cart = require('../models/cartSchema');

module.exports = async (req, res, next) => {
  try {

    const userId = req.user?._id;
    let count = 0;

    // =====================================
    // LOGGED USER → MongoDB
    // =====================================
    if (userId) {

      const cart = await Cart.findOne({ user_id: userId });

      if (cart) {
        count = cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
      }
    }

    // =====================================
    // GUEST USER → Session
    // =====================================
    else {

      const sessionCart = req.session.cart || [];

      count = sessionCart.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
    }

    res.locals.cartCount = count;

  } catch (error) {
    console.error('cart count middleware error:', error);
    res.locals.cartCount = 0;
  }

  next();
};