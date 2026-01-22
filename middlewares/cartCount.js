const Cart = require('../models/cartSchema');

module.exports = async (req, res, next) => {
    try {
        const userId = req.user?._id || req.session.userId;
    let count = 0;

if(userId) {
const cart = await Cart.findOne({user_id: userId});
count = cart ? cart.items.length : 0;
}

res.locals.cartCount = count;
} catch (error) {
      console.error('cart count middleware error :', error);
      res.locals.cartCount = 0;
        
    }
    next();
}