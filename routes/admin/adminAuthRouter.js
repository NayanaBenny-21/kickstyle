const express =require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/admin/authController');
const forgotPasswordController = require('../../controllers/admin/forgotPasswordController');

//LOGIN
router.get('/login', adminAuthController.loadLoginPage);
router.post('/login', adminAuthController.loginAdmin);
router.get('/login/verify-otp',adminAuthController.loadLoginVerify);
router.post('/login/resend-otp', adminAuthController.loginResendOtp);
router.post('/login/verify-otp', adminAuthController.loginVerifyOtp);

//FORGOT PASSWORD
router.get('/forgot-password', forgotPasswordController.loadForgotPassword);
router.post('/forgot-password', forgotPasswordController.forgotPassword);
router.get('/forgot-password/verify-otp', forgotPasswordController.loadResetVerify);
router.post('/forgot-password/verify-otp', forgotPasswordController.resetVerifyOtp);
router.post('/forgot-password/resend-otp', forgotPasswordController.resetResendOtp);
router.get('/forgot-password/reset', forgotPasswordController.loadReset);
router.post('/forgot-password/reset', forgotPasswordController.resetPassword);

//LOGOUT
router.post('/logout', adminAuthController.adminLogout);

//GOOGLE LOGIN/LOGOUT
router.get("/google", adminAuthController.googleLogin);
router.get("/google/callback", adminAuthController.googleCallback, adminAuthController.googleSuccess);
router.get("/google/logout", adminAuthController.logoutGoogle);
module.exports = router;