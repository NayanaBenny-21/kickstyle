const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
require('dotenv').config();

const userAuthMiddleware = async (req, res, next) => {

  console.log("========== 🔐 userAuthMiddleware START ==========");
  console.log("Requested URL:", req.originalUrl);

  const token = req.cookies.user_jwt;

  console.log("JWT Token from cookie:", token ? "✅ Present" : "❌ Not Present");

  if (!token) {

    console.log("❌ No token found. Redirecting to login...");

    const referer = req.get("Referer");
    console.log("Referer:", referer);

    if (referer) {
      try {
        const url = new URL(referer);
        req.session.returnTo = url.pathname;
      } catch (err) {
        console.log("⚠️ Invalid referer URL");
        req.session.returnTo = "/";
      }
    } else {
      req.session.returnTo = "/";
    }

    console.log("💾 returnTo saved as:", req.session.returnTo);
    console.log("========== 🔐 userAuthMiddleware END (NO TOKEN) ==========");

    return res.redirect('/auth/login');
  }

  try {

    console.log("🔎 Verifying JWT...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT Decoded:", decoded);

    if (decoded.role !== 'user') {

      console.log("❌ Invalid role:", decoded.role);

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

      console.log("========== 🔐 userAuthMiddleware END (ROLE FAIL) ==========");
      return res.redirect('/auth/login');
    }

    console.log("🔎 Finding user by ID:", decoded.id);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("❌ User not found in DB");
    }

    if (user?.isBlocked) {
      console.log("❌ User is blocked");
    }

    if (!user || user.isBlocked) {

      res.clearCookie('user_jwt');
      console.log("🧹 Cleared invalid JWT cookie");

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

      console.log("========== 🔐 userAuthMiddleware END (USER FAIL) ==========");
      return res.redirect('/auth/login');
    }

    // ✅ SUCCESS
    req.user = user;
    req.userId = user._id;

    console.log("✅ Authenticated User:", user.email);
    console.log("✅ req.userId set as:", req.userId);
    console.log("========== 🔐 userAuthMiddleware SUCCESS ==========");

    next();

  } catch (err) {

    console.log("❌ JWT verification failed:", err.message);
    res.clearCookie('user_jwt');
    console.log("🧹 Cleared invalid JWT cookie");

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

    console.log("========== 🔐 userAuthMiddleware END (JWT ERROR) ==========");
    return res.redirect('/auth/login');
  }
};

module.exports = userAuthMiddleware;