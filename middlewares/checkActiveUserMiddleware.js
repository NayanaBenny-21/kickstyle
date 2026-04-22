// middlewares/checkActiveUserMiddleware.js
module.exports = async function checkActiveUser(req, res, next) {
  try {
    const user = req.user; 
    if (!user) return next(); 

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

      return res.render('user/blocked',{hideHeader: true});
    }

    next();
  }  catch (err) {
    console.error("Error in checkActiveUser middleware:", err);
    next(err);
  }
};
