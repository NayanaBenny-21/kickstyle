const Wishlist = require('../models/wishlistSchema');

module.exports = async (req, res, next) => {
  try {
const userId = req.user ? req.user.id : req.session.userId;

    if (!userId) {
      res.locals.wishlistProductIds = [];
      return next();
    }

    const wishlist = await Wishlist.findOne({ user_id: userId });

    res.locals.wishlistProductIds = wishlist
      ? wishlist.items.map(item => item.productId.toString())
      : [];

    next();
  } catch (error) {
    console.error("Wishlist middleware error:", error);
    res.locals.wishlistProductIds = [];
    next();
  }
};
