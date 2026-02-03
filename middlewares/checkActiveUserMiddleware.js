// middlewares/checkActiveUserMiddleware.js
module.exports = async function checkActiveUser(req, res, next) {
  try {
    const user = req.user; // Passport sets req.user
    if (!user) return next(); // Not logged in, proceed

    if (user.isBlocked) {
      // Clear EVERYTHING
      res.clearCookie('user_jwt');
      res.clearCookie('connect.sid');
      res.clearCookie('user_session');

      if (req.session) {
        req.session.destroy(() => {});
      }

      if (req.logout) {
        req.logout(() => {});
      }


      res.locals.isUserLoggedIn = false;
      res.locals.isAdminLoggedIn = false;
      res.locals.user = null;

      return res.render('user/blocked');
    }

    next();
  }  catch (err) {
    console.error("Error in checkActiveUser middleware:", err);
    next(err);
  }
};
