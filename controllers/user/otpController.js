// controllers/authController.js
const User = require('../../models/userSchema');
const pendingUser = require('../../models/pendingUserSchema');
const { generateOTP, sendOTPEmail } = require('../../helpers/otp_email');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Wallet = require('../../models/walletSchema');
const WalletTransaction = require('../../models/walletTransactionSchema');
// Load OTP verification page
const loadSignupVerify = async (req, res) => {
    const email = req.session.pendingEmail;
    if (!email) return res.redirect('/auth/signup');

    let remainingTime = 0;
    let otpSent = false;

    if (req.session.otpSent && req.session.otpExpiresAt) {
        remainingTime = Math.floor((req.session.otpExpiresAt - Date.now()) / 1000);
        if (remainingTime > 0) otpSent = true;
        else remainingTime = 0;
    }

    res.render('user/confirmWithOTP_signup', {
        email,
        otpSent: remainingTime > 0,
        remainingTime, hideHeader: true
    });
};

// Resend OTP
const signupResendOtp = async (req, res) => {
    try {
        const email = req.session.pendingEmail;
        if (!email) return res.status(400).json({ success: false, message: "Session expired", redirect: "/auth/signup" });

        const pending = await pendingUser.findOne({ email });
        if (!pending) return res.status(404).json({ success: false, message: "Pending user not found", redirect: "/auth/signup" });

        const otp = generateOTP();
        const otpExpiresAt = Date.now() + 60 * 1000;

        await pendingUser.findOneAndUpdate({ email }, { otp, createdAt: Date.now() }, { new: true });

        req.session.otpExpiresAt = otpExpiresAt;
        req.session.otpSent = true;

        await sendOTPEmail(email, otp);

        res.json({ success: true, message: "OTP resent successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Verify OTP
const signupVerifyOtp = async (req, res) => {
  try {
    const email = req.session.pendingEmail;
    const { otp1, otp2, otp3, otp4 } = req.body;
    const otp = `${otp1}${otp2}${otp3}${otp4}`;

    const pendingUserRecord = await pendingUser.findOne({ email, otp });

    const now = Date.now();
    const remainingTime = req.session.otpExpiresAt ? Math.floor((req.session.otpExpiresAt - now) / 1000) : 0;

    if (!pendingUserRecord || !req.session.otpExpiresAt || now > req.session.otpExpiresAt) {
      return res.render('user/confirmWithOTP_signup', {
        email,
        error: "OTP invalid or expired",
        otpSent: remainingTime > 0,
        remainingTime,
        hideHeader: true
      });
    }

    // Create the actual user
    const newUser = await User.create({
      name: pendingUserRecord.name,
      email: pendingUserRecord.email,
      password: pendingUserRecord.password,
      referralCode: pendingUserRecord.referralCode,
      referredBy: pendingUserRecord.referredBy || null
    });

    console.log("New user : ", newUser)
    // Initialize wallet for new user
    await Wallet.create({ userId: newUser._id, balance: 0 });

    // Give ₹200 to the referrer if exists
  if (pendingUserRecord.referredBy) {
  let referrerWallet = await Wallet.findOne({
    userId: pendingUserRecord.referredBy
  });

  if (!referrerWallet) {
    referrerWallet = await Wallet.create({
      userId: pendingUserRecord.referredBy,
      balance: 0
    });
  }

  referrerWallet.balance += 200;
  await referrerWallet.save();

  await WalletTransaction.create({
    userId: pendingUserRecord.referredBy,
    type: 'credit',
    title: 'referral_bonus',
    amount: 200,
    status: 'success',
    payment_method: 'wallet',
    transactionId: `ref_${Date.now()}_${pendingUserRecord.referredBy}`
  });
}


    // Clean up pending user
    await pendingUser.deleteOne({ email });

    // Clear session
    req.session.pendingEmail = null;
    req.session.pendingUserId = null;
    req.session.otpExpiresAt = null;
    req.session.otpSent = false;

    return res.redirect('/auth/login');

  } catch (error) {
    console.error(error);
    res.render('user/confirmWithOTP_signup', { error: 'Server error', hideHeader: true });
  }
};

//***********LOGIN*************

//***load otp verify***
const loadLoginVerify = async (req, res) => {
    try {
        const email = req.session.loginEmail;
        if (!email) return res.redirect('/auth/login');

        const remainingTime = req.session.loginOTPExpiresAt
            ? Math.max(0, Math.floor((req.session.loginOTPExpiresAt - Date.now()) / 1000)) : 0;

        const otpSent = req.session.loginOTPSent || false;
        return res.render('user/confirmWithOTP', {
            email,
            otpSent: true,
            showToast: true,
            remainingTime,
            otpSuccess: false,
            hideHeader: true
        });

    } catch (error) {
        console.log('Login verify-otp page not loading', error);
        res.status(500).send('Server Error');
    }
};

//***Resend otp***

const loginResendOtp = async (req, res) => {
    try {
        const email = req.session.loginEmail;
        console.log("Email to resend OTP:", email);

       if (!email) {
    return res.status(400).json({
        success: false,
        message: "Session expired. Please login again.",
        redirect: "/auth/login"
    });
}


        const otp = generateOTP();
        const otpExpiresAt = Date.now() + 60 * 1000;
        req.session.loginOTP = otp;
        req.session.loginOTPExpiresAt = otpExpiresAt;
        req.session.loginOTPSent = true;
        await sendOTPEmail(email, otp);

        res.json({ success: true, message: "OTP resent successfully", remainingTime: 60 });

    } catch (err) {

        console.error("Resend OTP error:", err);

        res.status(500).json({ success: false, message: "Something went wrong. Please try again." });

    }

};

const loginVerifyOtp = async (req, res) => {
  try {
    const email = req.session.loginEmail;
    const storedOtp = req.session.loginOTP;
    const expiresAt = req.session.loginOTPExpiresAt;
    const { otp } = req.body;

    // 1️⃣ Session check
    if (!email || !storedOtp || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Session expired. Please login again.",
        redirect: "/auth/login"
      });
    }

    // 2️⃣ Expiry check
    if (Date.now() > expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
        showResend: true
      });
    }

    // 3️⃣ OTP match check
    if (otp !== storedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // 4️⃣ Fetch user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked"
      });
    }

    // 5️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

// 6️⃣ Set secure cookie
res.cookie("user_jwt", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000
});

// ✅ Save userId in session
req.session.userId = user._id;

const redirectUrl = req.session.returnTo || "/";

// Clear temp login session values
delete req.session.loginEmail;
delete req.session.loginUserId;
delete req.session.loginOTP;
delete req.session.loginOTPExpiresAt;
delete req.session.loginOTPSent;
delete req.session.returnTo;

// 🔥 IMPORTANT: Force session save before sending response
req.session.save((err) => {
  if (err) {
    console.error("Session save error:", err);
    return res.status(500).json({
      success: false,
      message: "Session error"
    });
  }

  return res.json({
    success: true,
    message: "Login successful",
    redirect: redirectUrl
  });
});

  } catch (error) {
    console.error("Login OTP verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again."
    });
  }
};

module.exports = { loadSignupVerify, signupResendOtp, signupVerifyOtp, loadLoginVerify, loginResendOtp, loginVerifyOtp };