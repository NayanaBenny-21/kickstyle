const jwt = require('jsonwebtoken');
require('dotenv').config();

const setAuthStatus = (req, res, next) => {
  // ---------------- User Status ----------------
  const userToken = req.cookies.user_jwt;
  res.locals.isUserLoggedIn = false;
  res.locals.user = null;

  if (userToken) {
    try {
      const decodedUser = jwt.verify(userToken, process.env.JWT_SECRET);
      res.locals.isUserLoggedIn = true;
      res.locals.user = decodedUser;
    } catch (err) {
      res.locals.isUserLoggedIn = false;
      res.locals.user = null;
    }
  }

  // ---------------- Admin Status ----------------
  const adminToken = req.cookies.admin_jwt;
  res.locals.isAdminLoggedIn = false;
  res.locals.admin = null;

  if (adminToken) {
    try {
      const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET);
      res.locals.isAdminLoggedIn = true;
      res.locals.admin = decodedAdmin;
    } catch (err) {
      res.locals.isAdminLoggedIn = false;
      res.locals.admin = null;
    }
  }

  next();
};

module.exports = setAuthStatus;
