const jwt = require('jsonwebtoken');
const User = require('../models/userSchema'); // adjust path
require('dotenv').config();

const userAuthMiddleware = async (req, res, next) => {
  const token = req.cookies.user_jwt;
  if (!token) return res.redirect('/auth/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check role
    if (decoded.role !== 'user') return res.redirect('/auth/login');

    // Fetch user from DB
    const user = await User.findById(decoded.id);
    if (!user) {
      res.clearCookie('user_jwt');
      return res.redirect('/auth/login');
    }

    // Check if user is blocked
    if (user.isBlocked) { // assuming you have a boolean field isBlocked
      res.clearCookie('user_jwt');
      return res.redirect('/auth/login'); // or redirect to a "blocked" page
    }

    // Attach user info to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.clearCookie('user_jwt');
    return res.redirect('/auth/login');
  }
};

module.exports = userAuthMiddleware;
