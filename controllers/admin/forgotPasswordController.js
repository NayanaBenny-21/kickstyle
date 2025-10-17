const bcrypt = require("bcryptjs");
const validator = require('validator');
const Admin = require('../../models/adminSchema');
const { generateOTP, sendOTPEmail } = require('../../helpers/otp_email');

// --- Load Forgot Password page ---
const loadForgotPassword = async (req, res) => {
  try {
    res.render('admin/forgotPassword', { email: '', general_error: null });
  } catch (error) {
    console.error('Forgot password page error:', error);
    res.status(500).send('Server Error');
  }
};

// --- Forgot Password ---
const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    email = email ? email.trim() : '';
    let general_error = null;

    if (!validator.isEmail(email)) general_error = "Invalid email address";
    if (general_error) {
      return res.render("admin/forgotPassword", { general_error, email });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render("admin/forgotPassword", { email, swal: { text: "No account found with this email", icon: "error" } });
    }

    const otp = generateOTP();

    // Save session variables
    req.session.adminResetEmail = email;
    req.session.resetAdminId = admin._id;
    req.session.adminResetOtp = otp;
    req.session.adminResetOtpSent = true;
    req.session.adminResetOtpExpiresAt = Date.now() + 60 * 1000; // 1 min
    req.session.resetVerifiedAdmin = false;
    req.session.resetSuccessAdmin = false;

    // Send OTP email
    await sendOTPEmail(email, otp);

    return res.redirect('/adminAuth/forgot-password/verify-otp');

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.render("admin/forgotPassword", {
      email: req.body.email || '',
      swal: { text: "Something went wrong. Please try again later", icon: "error" }
    });
  }
};

// --- Load OTP Verification page ---
const loadResetVerify = async (req, res) => {
  try {
    if (!req.session.adminResetOtpSent || !req.session.adminResetEmail) {
      return res.redirect('/adminAuth/forgot-password');
    }

    const email = req.session.adminResetEmail;
    const remainingTime = req.session.adminResetOtpExpiresAt 
      ? Math.max(0, Math.floor((req.session.adminResetOtpExpiresAt - Date.now()) / 1000)) 
      : 0;
    const otpSent = req.session.adminResetOtpSent || false;

    res.render('admin/confirmWithOTP_reset', {
      email,
      otpSent,
      remainingTime,
      otpSuccess: false
    });

  } catch (error) {
    console.error("Reset OTP page error:", error);
    res.status(500).send("Server Error");
  }
};

// --- Verify OTP ---
const resetVerifyOtp = async (req, res) => {
  try {
    const email = req.session.adminResetEmail;
    const { otp1, otp2, otp3, otp4 } = req.body;
    const otp = `${otp1}${otp2}${otp3}${otp4}`;
    const remainingTime = req.session.adminResetOtpExpiresAt 
      ? Math.max(0, Math.floor((req.session.adminResetOtpExpiresAt - Date.now()) / 1000)) 
      : 0;


    if (!req.session.adminResetOtp || remainingTime <= 0) {
      req.session.adminResetOtp = null;
      req.session.adminResetOtpSent = false;
      return res.render('admin/confirmWithOTP_reset', {
        email,
        swal: { icon: "error", text: "OTP expired. Please resend." },
        otpSent: false,
        remainingTime: 0,
        otpSuccess: false
      });
    }

 
    if (otp !== req.session.adminResetOtp) {
      return res.render('admin/confirmWithOTP_reset', {
        email,
        error: "Invalid OTP",
        otpSent: false,
        remainingTime,
        otpSuccess: false
      });
    }

   
    req.session.resetVerifiedAdmin = true;
    req.session.adminResetOtp = null;
    req.session.adminResetOtpSent = false;
    req.session.adminResetOtpExpiresAt = null;

    return res.redirect('/adminAuth/forgot-password/reset');

  } catch (error) {
    console.error("Reset OTP verify error:", error);
    return res.render('admin/confirmWithOTP_reset', {
      email: req.session.adminResetEmail,
      swal: { icon: "error", text: "Server error. Please try again." },
      otpSent: false,
      remainingTime: 0,
      otpSuccess: false
    });
  }
};

// --- Resend OTP ---
const resetResendOtp = async (req, res) => {
  try {
    const email = req.session.adminResetEmail;
    const adminId = req.session.resetAdminId;

    if (!email || !adminId) {
      return res.status(400).json({ success: false, message: "Session expired. Please login again." });
    }

    const otp = generateOTP();
    req.session.adminResetOtp = otp;
    req.session.adminResetOtpExpiresAt = Date.now() + 60 * 1000;
    req.session.adminResetOtpSent = true;

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: "OTP resent successfully", remainingTime: 60 });

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
};

// --- Load Change Password page ---
const loadReset = async (req, res) => {
  try {
    const resetSuccess = req.session.resetSuccessAdmin || false;
    req.session.resetSuccessAdmin = false;

    if (!req.session.resetVerifiedAdmin && !resetSuccess) {
      return res.redirect('/adminAuth/forgot-password');
    }

    res.render('admin/changePassword', { 
      email: req.session.adminResetEmail || '',
      resetSuccess
    });

  } catch (error) {
    console.error("Reset password page error:", error);
    res.status(500).send("Server Error");
  }
};

// --- Change Password ---
const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!req.session.resetVerifiedAdmin || !req.session.resetAdminId) {
      return res.redirect('/adminAuth/forgot-password');
    }

    const email = req.session.adminResetEmail;
    let general_error = null;
    const password = newPassword ? newPassword.trim() : '';
    const confirm = confirmPassword ? confirmPassword.trim() : '';
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

    if (!password) general_error = "Please fill the password field.";
    else if (!passwordRegex.test(password)) general_error = "Password must include at least one letter, one number, and one special character.";
    else if (confirm !== password) general_error = "Passwords do not match";

    if (general_error) {
      return res.render("admin/changePassword", { general_error, email, resetSuccess: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.findByIdAndUpdate(req.session.resetAdminId, { password: hashedPassword });


    req.session.adminResetOtp = null;
    req.session.adminResetOtpSent = false;
    req.session.adminResetOtpExpiresAt = null;
    req.session.resetAdminId = null;
    req.session.resetVerifiedAdmin = false;
    req.session.resetSuccessAdmin = true;

    return res.redirect('/adminAuth/forgot-password/reset');

  } catch (error) {
    console.error("Reset password error:", error);
    return res.render("admin/changePassword", { 
      swal: { icon: "error", text: "Something went wrong. Please try again." },
      email: req.session.adminResetEmail,
      resetSuccess: false
    });
  }
};

module.exports = { loadForgotPassword, forgotPassword, loadResetVerify,
  resetVerifyOtp, resetResendOtp, loadReset, resetPassword
};
