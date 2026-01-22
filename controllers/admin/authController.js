const Admin = require('../../models/adminSchema');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken'); 
const validator = require('validator');
const passport = require("../../config/passportAdmin");
const { generateOTP, sendOTPEmail } = require('../../helpers/otp_email');

//***Load login page***
const loadLoginPage = async (req, res) => {
  try {
    return res.render('admin/login');
  } catch (error) {
    console.log('Login page not loading', error);
    res.status(500).send('Server Error');
  }
};
const loginAdmin = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();
    let error = null;
  if (!validator.isEmail(email)) error = "Invalid email address";
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
  if (!passwordRegex.test(password)) error = "Password must include at least one letter, one number, and one special character.";
 if (error) {
    return res.render("admin/login", { error, email });
  } 
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render('admin/login', { error: "No admin found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render('admin/login', { error: "Incorrect password" });
    }
    const otp = generateOTP(); 
    req.session.adminLoginOTP = otp;
    req.session.adminLoginOTPExpiresAt = Date.now() + 60 * 1000; // 1 minute expiry
    req.session.adminPendingId = admin._id;
       req.session.adminLoginOTPSent = true;
           req.session.adminEmail = email;
await sendOTPEmail(email, otp);

    return res.redirect('/adminAuth/login/verify-otp');

  } catch (err) {
    console.error("Admin login error:", err);
    return res.render('admin/login', { error: "Server error" });
  }
};
const loadLoginVerify = async (req, res) => {
    try {
        const email = req.session.adminEmail;
        if (!email) return res.redirect('/adminAuth/login');

        const remainingTime = req.session.adminLoginOTPExpiresAt
            ? Math.max(0, Math.floor((req.session.adminLoginOTPExpiresAt - Date.now()) / 1000)) : 0;

        const otpSent = req.session.adminLoginOTPSent || false;
        return res.render('admin/confirmWithOTP', {
            email,
            otpSent: true,
            showToast: true,
            remainingTime,
            otpSuccess: false
        });

    } catch (error) {
        console.log('Login verify-otp page not loading', error);
        res.status(500).send('Server Error');
    }
};

//***Resend otp***

const loginResendOtp = async (req, res) => {
    try {
        const email = req.session.adminEmail;
        console.log("Email to resend OTP:", email);

        if (!email) {
            return res.status(400).json({ success: false, message: "Session expired. Please Login again." });
        }

        const otp = generateOTP();
        const otpExpiresAt = Date.now() + 60 * 1000;
        req.session.adminLoginOTP = otp;
        req.session.adminLoginOTPExpiresAt = otpExpiresAt;
        req.session.adminLoginOTPSent = true;
        await sendOTPEmail(email, otp);

        res.json({ success: true, message: "OTP resent successfully", remainingTime: 60 });

    } catch (err) {

        console.error("Resend OTP error:", err);

        res.status(500).json({ success: false, message: "Something went wrong. Please try again." });

    }

};

const loginVerifyOtp = async (req, res) => {
    try {
        const email = req.session.adminEmail;
        const { otp1, otp2, otp3, otp4 } = req.body;
        const otp = `${otp1}${otp2}${otp3}${otp4}`;
        const remainingTime = req.session.adminLoginOTPExpiresAt ? Math.floor((req.session.adminLoginOTPExpiresAt - Date.now()) / 1000) : 0;

        if (!req.session.adminLoginOTPExpiresAt || Date.now() > req.session.adminLoginOTPExpiresAt) {
            return res.render('admin/confirmWithOTP', {
                email,
                error: "OTP invalid or expired",
                otpSent: false,
                showToast: false,
                remainingTime
            });
        }
        if (otp !== req.session.adminLoginOTP) {
            return res.render('admin/confirmWithOTP', {
                email,
                error: 'Invalid OTP',
                otpSent: false,
                remainingTime,
                showToast : false,
                 otpSuccess: false
            });
        }
      const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render('admin/confirmWithOTP', { error: "Admin not found" });
    }

    const payload = { id: admin._id, email: admin.email, role: 'admin' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('admin_jwt', token, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 1000
    });


    req.session.adminEmail = null;
    req.session.adminPendingId = null;
    req.session.adminLoginOTP = null;
    req.session.adminLoginOTPExpiresAt = null;
    req.session.adminLoginOTPSent = false;

    return res.render('admin/confirmWithOTP', {
      email,
      otpSent: false,
      remainingTime: 0,
      otpSuccess: true
    });

  } catch (error) {
    console.error("Admin OTP verify error:", error);
    res.render('admin/confirmWithOTP', { error: 'Server error' });
  }
};


const adminLogout = ((req, res)=>{
    try {
        res.clearCookie('admin_jwt'); 
  req.session.destroy(() => {
   return res.redirect('/adminAuth/login'); 
  });
    } catch (error) {
        console.error("Logout error:", error);
    res.status(500).send("Server error");
    }
})


const googleLogin = passport.authenticate("google-admin", {
  scope: ["profile", "email"],
  prompt: "select_account",
});
const googleCallback = passport.authenticate("google-admin", {
  failureRedirect: "/adminAuth/login",
});

const googleSuccess = async (req, res) => {
  try {
    if (!req.user) {
      console.log("No user returned from passport");
      return res.redirect("/adminAuth/login");
    }

    // Session
    req.session.adminId = req.user._id;

    // JWT
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("admin_jwt", token, { httpOnly: true, secure: false });

    console.log("Admin logged in via Google:", req.user.email);

    console.log("Session ID:", req.sessionID);
console.log("Session adminId:", req.session.adminId);
console.log("Cookies:", req.cookies);

    res.redirect("/admin/product-management");
  } catch (err) {
    console.error("Google admin login error:", err);
    res.redirect("/adminAuth/login");
  }
};






module.exports = {loadLoginPage, loginAdmin, loadLoginVerify, loginResendOtp, loginVerifyOtp, adminLogout,
googleLogin, googleCallback, googleSuccess 
}