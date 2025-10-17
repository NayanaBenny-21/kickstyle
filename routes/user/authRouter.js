const express =require('express');
const router = express.Router();
const authController = require('../../controllers/user/authController');
const otpController = require('../../controllers/user/otpController');
const forgotPasswordController = require('../../controllers/user/forgotPasswordController');

//SIGNUP 
router.get('/signup', authController.loadSignup);
router.post('/signup', authController.signupUser);
router.get('/signup/verify-otp', otpController.loadSignupVerify);
router.post('/signup/resend-otp', otpController.signupResendOtp);
router.post('/signup/verify-otp', otpController.signupVerifyOtp);

//LOGIN
router.get('/login', authController.loadLoginPage);
router.post('/login', authController.loginUser);
router.get('/login/verify-otp',otpController.loadLoginVerify);
router.post('/login/verify-otp',otpController.loginVerifyOtp);
router.post('/login/resend-otp', otpController.loginResendOtp);

//FORGOT PASSWORD
router.get('/forgot-password', forgotPasswordController.loadForgotPassword );
router.post('/forgot-password', forgotPasswordController.forgotPassword);
router.get('/forgot-password/verify-otp', forgotPasswordController.loadResetVerify);
router.post('/forgot-password/verify-otp', forgotPasswordController.resetVerifyOtp);
router.post('/forgot-password/resend-otp', forgotPasswordController.resetResendOtp);
router.get('/forgot-password/reset', forgotPasswordController.loadReset);
router.post('/forgot-password/reset', forgotPasswordController.resetPassword);

//LOGOUT
router.get("/logout", authController.logout);
router.post("/logout", authController.logout);

//GOOGLE AUTH
router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback, authController.googleSuccess);
router.get("/logout/google", authController.logoutGoogle);

router.get('/user', (req, res) => {
  res.render('admin/user_manangement');
});




router.get('/change-password', (req, res) => {
  res.render('user/changePassword');
});


module.exports = router;