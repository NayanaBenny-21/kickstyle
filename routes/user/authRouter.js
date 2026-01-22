const express =require('express');
const router = express.Router();
const authController = require('../../controllers/user/authController');
const otpController = require('../../controllers/user/otpController');
const forgotPasswordController = require('../../controllers/user/forgotPasswordController');
const loggedInUserRedirect = require('../../middlewares/loggedInUserRedirect');
const noCache = require('../../middlewares/noCache');

//SIGNUP 
router.get('/signup', loggedInUserRedirect, authController.loadSignup);
router.post('/signup', loggedInUserRedirect, authController.signupUser);
router.get('/signup/verify-otp',loggedInUserRedirect, otpController.loadSignupVerify);
router.post('/signup/resend-otp', loggedInUserRedirect,otpController.signupResendOtp);
router.post('/signup/verify-otp', loggedInUserRedirect,otpController.signupVerifyOtp);

//LOGIN
router.get('/login', loggedInUserRedirect, authController.loadLoginPage);
router.post('/login', loggedInUserRedirect, authController.loginUser);
router.get('/login/verify-otp', loggedInUserRedirect, otpController.loadLoginVerify);
router.post('/login/verify-otp', loggedInUserRedirect, otpController.loginVerifyOtp);
router.post('/login/resend-otp', loggedInUserRedirect, otpController.loginResendOtp);

//FORGOT PASSWORD
router.get('/forgot-password', loggedInUserRedirect, forgotPasswordController.loadForgotPassword );
router.post('/forgot-password', loggedInUserRedirect, forgotPasswordController.forgotPassword);
router.get('/forgot-password/verify-otp',loggedInUserRedirect, forgotPasswordController.loadResetVerify);
router.post('/forgot-password/verify-otp', loggedInUserRedirect, forgotPasswordController.resetVerifyOtp);
router.post('/forgot-password/resend-otp',  loggedInUserRedirect,forgotPasswordController.resetResendOtp);
router.get('/forgot-password/reset', forgotPasswordController.loadReset);
router.post('/forgot-password/reset', forgotPasswordController.resetPassword);

//LOGOUT
router.get("/logout", authController.logout);
router.post("/logout", authController.logout);

//GOOGLE AUTH
router.get("/google", noCache,authController.googleLogin);
router.get("/google/callback", noCache,authController.googleCallback, authController.googleSuccess);
router.get("/logout/google",noCache, authController.logoutGoogle);

router.get('/user', (req, res) => {
  res.render('admin/user_manangement');
});

router.post('/store-referral', (req, res) => {
  req.session.referralCode = req.body.referralCode;
  res.json({ success: true });
});



router.get('/change-password', (req, res) => {
  res.render('user/changePassword');
});


module.exports = router;