const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
require('dotenv').config();

const userAuthMiddleware = async (req, res, next) => {

  console.log("==========  userAuthMiddleware START ==========");
  console.log("Requested URL:", req.originalUrl);

  const token = req.cookies.user_jwt;

  console.log("JWT Token from cookie:", token ? " Present" : " Not Present");

  if (!token) {

    console.log(" No token found. Redirecting to login...");

    const referer = req.get("Referer");
    console.log("Referer:", referer);

    if (referer) {
      try {
        const url = new URL(referer);
        req.session.returnTo = url.pathname;
      } catch (err) {
        console.log("Invalid referer URL");
        req.session.returnTo = "/";
      }
    } else {
      req.session.returnTo = "/";
    }


    return res.redirect('/auth/login');
  }

  try {


    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'user') {



      const referer = req.get("Referer");

      if (referer) {
        try {
          const url = new URL(referer);
          req.session.returnTo = url.pathname;
        } catch {
          req.session.returnTo = "/";
        }
      } else {
        req.session.returnTo = "/";
      }

      return res.redirect('/auth/login');
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      console.log(" User not found in DB");
    }

    if (user?.isBlocked) {
      console.log(" User is blocked");
    }

    if (!user || user.isBlocked) {

      res.clearCookie('user_jwt');

      const referer = req.get("Referer");

      if (referer) {
        try {
          const url = new URL(referer);
          req.session.returnTo = url.pathname;
        } catch {
          req.session.returnTo = "/";
        }
      } else {
        req.session.returnTo = "/";
      }

      return res.redirect('/auth/login');
    }

    // SUCCESS
    req.user = user;
    req.userId = user._id;


    next();

  } catch (err) {

    res.clearCookie('user_jwt');


    const referer = req.get("Referer");

    if (referer) {
      try {
        const url = new URL(referer);
        req.session.returnTo = url.pathname;
      } catch {
        req.session.returnTo = "/";
      }
    } else {
      req.session.returnTo = "/";
    }


    return res.redirect('/auth/login');
  }
};

module.exports = userAuthMiddleware;