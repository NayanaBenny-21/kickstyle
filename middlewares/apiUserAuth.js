const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const apiUserAuth = async (req, res, next) => {

  const token = req.cookies.user_jwt;

  if (!token) {
    return res.status(401).json({
      loginRequired: true
    });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.isBlocked) {
      res.clearCookie('user_jwt');
      return res.status(401).json({
        loginRequired: true
      });
    }

    req.user = user;
    req.userId = user._id;
    next();

  } catch (err) {
    res.clearCookie('user_jwt');
    return res.status(401).json({
      loginRequired: true
    });
  }
};

module.exports = apiUserAuth;