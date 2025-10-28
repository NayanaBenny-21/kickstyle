const bcrypt = require("bcryptjs");
const validator = require('validator');
const User = require('../../models/userSchema');
const { generateOTP, sendOTPEmail } = require('../../helpers/otp_email');

// --- Load Forgot Password page ---
const loadForgotPassword = async (req, res) => {
  try {
    res.render('user/forgotPassword', { email: '', general_error: null });
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
      return res.render("user/forgotPassword", { general_error, email });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.render("user/login", { swal: { text: "No account found with this email", icon: "error" } });
    }
    if (existingUser.isBlocked) {
      return res.render("user/forgotPassword", { swal: { text: "Your account is blocked", icon: "warning" } });
    }

    const otp = generateOTP();
    req.session.resetOtp = otp;
    req.session.resetOtpSent = true;
    req.session.resetOtpExpiresAt = Date.now() + 60 * 1000;
    req.session.resetEmail = email;
    req.session.resetUserId = existingUser._id;

    await sendOTPEmail(email, otp);

    return res.redirect('/auth/forgot-password/verify-otp');

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.render("user/forgotPassword", {
      email: req.body.email || '',
      swal: { text: "Something went wrong. Please try again later", icon: "error" }
    });
  }
};

// --- Load OTP Verification page ---
const loadResetVerify = async (req, res) => {
  try {
    if (!req.session.resetOtpSent || !req.session.resetEmail) {
      return res.redirect('/auth/forgot-password');
    }

    const email = req.session.resetEmail;
    const remainingTime = req.session.resetOtpExpiresAt ? Math.floor((req.session.resetOtpExpiresAt - Date.now()) / 1000) : 0;
    const otpSent = req.session.resetOtpSent || false;

    res.render('user/confirmWithOTP_reset', {
      email,
      otpSent,
      remainingTime,
      otpSuccess: false,
      showOtpSentToast: true
    });

  } catch (error) {
    console.error("Reset OTP page error:", error);
    res.status(500).send("Server Error");
  }
};

// --- Verify OTP ---
const resetVerifyOtp = async (req, res) => {
  try {
    const email = req.session.resetEmail;
    const { otp1, otp2, otp3, otp4 } = req.body;
    const otp = `${otp1}${otp2}${otp3}${otp4}`;

    if (!req.session.resetOtp || !req.session.resetOtpExpiresAt || Date.now() > req.session.resetOtpExpiresAt) {
      return res.render('user/confirmWithOTP_reset', {
        email,
        general_error: "OTP invalid or expired",
        otpSent: false,
        remainingTime: 0,
        showOtpSentToast: false 
      });
    }

    if (otp !== req.session.resetOtp) {
        const remainingTime = req.session.resetOtpExpiresAt
    ? Math.max(0, Math.floor((req.session.resetOtpExpiresAt - Date.now()) / 1000))
    : 0;
      return res.render('user/confirmWithOTP_reset', {
        email,
        general_error: "Invalid OTP",
        showOtpSentToast: false, 
        otpSent:  remainingTime > 0,
       remainingTime
      });
    }

    req.session.resetVerified = true;
    req.session.resetOtp = null;
    req.session.resetOtpSent = false;
    req.session.resetOtpExpiresAt = null;

    return res.redirect('/auth/forgot-password/reset');

  } catch (error) {
    console.error("Reset OTP verify error:", error);
    return res.render('user/confirmWithOTP_reset', {
      email: req.session.resetEmail,
      swal: { icon: "error", text: "Server error. Please try again." },
      otpSent: false,
      remainingTime: 0
    });
  }
};

// --- Resend OTP ---
const resetResendOtp = async (req, res) => {
  try {
    const email = req.session.resetEmail;

    if (!email) {
      return res.status(400).json({ success: false, message: "Session expired. Please Login again." });
    }

    const otp = generateOTP();
    req.session.resetOtp = otp;
    req.session.resetOtpExpiresAt = Date.now() + 60 * 1000;
    req.session.resetOtpSent = true;

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
    if (!req.session.resetVerified && !req.session.resetSuccess) {
      return res.redirect('/auth/forgot-password');
    }

    const resetSuccess = req.session.resetSuccess || false;
    req.session.resetSuccess = false;

    res.render('user/changePassword', { 
      email: req.session.resetEmail || '',
      resetSuccess
    });

  } catch (error) {
    console.error("Reset password page error:", error);
    res.status(500).send("Server Error");
  }
};

// --- Change Password  ---
const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!req.session.resetVerified || !req.session.resetUserId) {
      return res.redirect('/auth/forgot-password');
    }

    const email = req.session.resetEmail;
    let general_error = null;

    const password = newPassword ? newPassword.trim() : '';
    const confirm = confirmPassword ? confirmPassword.trim() : '';
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

    if (!password) general_error = "Please fill the password field.";
    else if (!passwordRegex.test(password)) general_error = "Password must include at least one letter, one number, and one special character.";
    else if (confirm !== password) general_error = "Passwords do not match";

    if (general_error) {
      return res.render("user/changePassword", { general_error, email, resetSuccess: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.session.resetUserId, { password: hashedPassword });

    req.session.resetOtp = null;
    req.session.resetOtpSent = false;
    req.session.resetOtpExpiresAt = null;
    req.session.resetUserId = null;
    req.session.resetVerified = false;

   
    req.session.resetSuccess = true;

    return res.redirect('/auth/forgot-password/reset');

  } catch (error) {
    console.error("Reset password error:", error);
    return res.render("user/changePassword", { 
      swal: { icon: "error", text: "Something went wrong. Please try again." },
      email: req.session.resetEmail,
      resetSuccess: false
    });
  }
};

module.exports = { loadForgotPassword, forgotPassword, loadResetVerify, resetVerifyOtp, resetResendOtp, loadReset, resetPassword };
