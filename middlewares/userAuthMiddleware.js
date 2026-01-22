const jwt = require('jsonwebtoken');
require('dotenv').config();

const userAuthMiddleware = (req, res, next) => {
  const token = req.cookies.user_jwt;
  if (!token) return res.redirect('/auth/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'user') return res.redirect('/auth/login');

    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch {
    res.clearCookie('user_jwt');
    return res.redirect('/auth/login');
  }
};


module.exports = userAuthMiddleware;
