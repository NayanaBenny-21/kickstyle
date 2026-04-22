const requireLogin = (req, res, next) => {


  if (req.session.userId) {
    return next();
  }

  // Store the page user came from
  req.session.returnTo = req.originalUrl;

  console.log("STORED URL:", req.session.returnTo);

  // Redirect to login
  return res.redirect('/auth/login');
};

module.exports = requireLogin;
