const User = require('../../models/userSchema');
const pendingUser = require("../../models/pendingUserSchema");
const bcrypt = require("bcryptjs");
const passport = require('passport');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { generateOTP, sendOTPEmail } = require('../../helpers/otp_email');
const generateReferralCode = require('../../helpers/generateReferralCode');

//***********SIGNUP NEW USER***********
// ***Load signup page***
const loadSignup = async (req, res) => {
  try {
    return res.render('user/signup', { hideHeader: true });
  } catch (error) {
    console.log('Signup page not loading', error);
    res.status(500).send('Server Error');
  }
};

//*** Sign up ***
const signupUser = async (req, res) => {
  console.log("req.body:", req.body);

  if (req.method !== "POST" || !req.body) {
    return res.status(400).render('user/signup', {
      general_error: "Invalid request", name: "", email: "", hideHeader: true
    });
  }

  let { name, email, password, confirmPassword, referralCode } = req.body;

  // Trim inputs
  name = name ? name.trim() : '';
  email = email ? email.trim() : '';
  password = password ? password.trim() : '';
  confirmPassword = confirmPassword ? confirmPassword.trim() : '';
  referralCode = referralCode?.trim();

  let general_error = null;
  let passwordError = null;
  let confirmError = null;
  const myReferralCode = generateReferralCode(name);
  const nameRegex = /^[A-Za-z\s]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

  // Basic validations for the entries
  if (!name) {
    general_error = "Please enter your name";
  } else if (!nameRegex.test(name)) {
    general_error = "Name should contain only alphabets";
  } else if (!email) {
    general_error = "Please enter your email";
  } else if (!validator.isEmail(email)) {
    general_error = "Invalid email address";
  }
  // PASSWORD VALIDATION
  if (!password) {
    passwordError = "Please fill the password field.";
  }
  else if (!passwordRegex.test(password)) {
    passwordError =
      "Password must be 8–12 characters and include at least one letter, one number, and one special character.";
  }

  // CONFIRM PASSWORD VALIDATION (SEPARATE ❗)
  if (!confirmPassword) {
    confirmError = "Please confirm your password";
  }
  else if (password !== confirmPassword) {
    confirmError = "Passwords do not match";
  }
  if (general_error || passwordError || confirmError) {
    return res.render("user/signup", {
      general_error,
      passwordError,
      confirmError,
      name,
      email,
      hideHeader: true
    });
  }

  try {
    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).render('user/signup', {
        general_error: "User already exists", name, email, hideHeader: true
      });
    }

    let referredByUser = null;

    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
      console.log("Referralby :", referredByUser)
      if (!referredByUser) {
        return res.render('user/signup', {
          general_error: "Invalid referral code",
          name,
          email, hideHeader: true
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Create or update pending user
    let pending = await pendingUser.findOne({ email });
    if (!pending) {
      pending = await pendingUser.create({
        name,
        email,
        password: hashedPassword,
        otp,
        referralCode: myReferralCode,
        referredBy: referredByUser?._id || null
      });

      console.log('Pending user saved:', pending);
    }
    else {
      pending = await pendingUser.findOneAndUpdate(
        { email },
        {
          name,
          password: hashedPassword,
          otp,
          referralCode: myReferralCode,
          referredBy: referredByUser?._id || null,
          createdAt: Date.now()
        },
        { upsert: true, new: true }
      );

      console.log('Pending user saved:', pending);

    }
    req.session.pendingEmail = email;
    req.session.pendingUserId = pending._id;
    req.session.otp = otp;
    req.session.otpExpiresAt = Date.now() + 60 * 1000;
    req.session.otpSent = true;

    try {
      await sendOTPEmail(email, otp);
      console.log("OTP sent successfully");
    } catch (err) {
      console.log("OTP send error:", err);
    }

    req.session.save((err) => {
      if (err) {
        console.log("Session save failed:", err);
        return res.redirect('/auth/signup');
      }

      console.log("Session saved. Redirecting now...");
      res.redirect('/auth/signup/verify-otp');
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).render('user/signup', {
      general_error: "Please try again", name, email
    });
  }
};

//*******************LOGIN USER*******************
//***Load login page***
const loadLoginPage = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.render('user/login', { hideHeader: true });
  } catch (error) {
    console.log('Login page not loading', error);
    res.status(500).send('Server Error');
  }
};

//***Verify the login user***
const loginUser = async (req, res) => {
  console.log("req.body in login :", req.body);

  if (req.method !== "POST" || !req.body) {
    return res.status(400).render("user/login", {
      general_error: "Invalid request",
      email: "",
      hideHeader: true
    });
  }

  let { email, password } = req.body;
  email = email ? email.trim() : "";
  password = password ? password.trim() : "";

  try {
    const existingUser = await User.findOne({ email });

    // If user not found
    if (!existingUser) {
      return res.render("user/login", {
        general_error: "Incorrect password or email",
        email,
        hideHeader: true
      });
    }

    // If user blocked
    if (existingUser.isBlocked) {
      return res.render("user/login", {
        general_error: "Your account is blocked",
        email,
        hideHeader: true
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    // If password incorrect
    if (!isMatch) {
      return res.render("user/login", {
        general_error: "Incorrect password",
        email,
        hideHeader: true
      });
    }

    // OTP flow
    const otp = generateOTP();
    req.session.loginUserId = existingUser._id;
    req.session.loginEmail = email;
    req.session.loginOTP = otp;
    req.session.loginOTPExpiresAt = Date.now() + 60 * 1000;
    req.session.loginOTPSent = true;

    await sendOTPEmail(email, otp);

    return res.redirect("/auth/login/verify-otp");

  } catch (error) {
    console.error("Login error:", error);
    return res.render("user/login", {
      general_error: "Something went wrong. Please try again later.",
      email,
      hideHeader: true
    });
  }
};

//logout
const logout = (req, res, next) => {
  try {
    // Only call logout if req.logout exists
    if (req.logout && typeof req.logout === 'function') {
      req.logout(function (err) {
        if (err) return next(err);

        // Destroy session only if it exists
        if (req.session) {
          req.session.destroy(function (err) {
            if (err) console.error("Session destroy error:", err);
            res.clearCookie('connect.sid'); // clear session cookie
            res.clearCookie('user_jwt');    // clear JWT cookie if used
            return res.redirect("/auth/login");
          });
        } else {
          // Session doesn't exist, just clear cookies
          res.clearCookie('connect.sid');
          res.clearCookie('user_jwt');
          return res.redirect("/auth/login");
        }
      });
    } else {
      // Fallback if req.logout is not defined
      if (req.session) {
        req.session.destroy(function (err) {
          if (err) console.error("Session destroy error:", err);
          res.clearCookie('connect.sid');
          res.clearCookie('user_jwt');
          return res.redirect("/auth/login");
        });
      } else {
        res.clearCookie('connect.sid');
        res.clearCookie('user_jwt');
        return res.redirect("/auth/login");
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).send("Server error");
  }
};




const googleSuccess = (req, res) => {
  if (!req.user) return res.send('<script>window.close();</script>');

  req.session.userId = req.user._id;

  const payload = { id: req.user._id, name: req.user.name, email: req.user.email, role: 'user' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.cookie('user_jwt', token, { httpOnly: true });

  // Send script to popup to notify main window
  res.send(`
    <script>
      window.opener.postMessage({ type: 'google-auth-success' }, window.location.origin);
      window.close();
    </script>
  `);
};


const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
  prompt: "select_account"
});

const googleCallback = passport.authenticate("google", {
  failureRedirect: "/auth/login",
});

const logoutGoogle = logout;


module.exports = {
  loadSignup, signupUser, loadLoginPage, loginUser, logout,
  googleLogin, googleCallback, googleSuccess, logoutGoogle
};





