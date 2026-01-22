// setAuthStatus.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const setAuthStatus = (req, res, next) => {
  // Skip if admin route
  if (req.originalUrl.startsWith('/admin')) return next();

  // Default
  res.locals.isUserLoggedIn = false;
  res.locals.user = null;

  const userToken = req.cookies.user_jwt;
  if (userToken) {
    try {
      const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
      if (decoded?.role === 'user') {
        res.locals.isUserLoggedIn = true;
        res.locals.user = decoded;
      }
    } catch (err) {
      res.clearCookie('user_jwt'); // Remove invalid token
      res.locals.isUserLoggedIn = false;
      res.locals.user = null;
    }
  }

  next();
};

module.exports = setAuthStatus;
