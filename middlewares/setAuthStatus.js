// setAuthStatus.js
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
require('dotenv').config();

const setAuthStatus = async (req, res, next) => {
  // Skip admin routes
  if (req.originalUrl.startsWith('/admin')) return next();

  res.locals.isUserLoggedIn = false;
  res.locals.user = null;

  const userToken = req.cookies.user_jwt;

  if (!userToken) {
    return next();
  }

  try {
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);

    if (decoded?.role !== 'user') {
      return next();
    }

    const user = await User.findById(decoded.id);

    if (!user || user.isBlocked) {
      res.clearCookie('user_jwt');
      return next();
    }

    // Attach to request (IMPORTANT FIX)
    req.user = user;
    req.userId = user._id;

    //  Attach to handlebars
    res.locals.isUserLoggedIn = true;
    res.locals.user = user;

  } catch (err) {
    console.log("setAuthStatus JWT error:", err.message);
    res.clearCookie('user_jwt');
  }

  next();
};

module.exports = setAuthStatus;