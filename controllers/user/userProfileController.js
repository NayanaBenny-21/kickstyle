const { json } = require('express');
const { generateOTP, sendOTPEmail } = require('../../helpers/otp_email');
const User = require('../../models/userSchema');
const bcrypt = require('bcryptjs'); 
const sharp = require("sharp");
const path = require('path');
const fs = require('fs');



//---------------USER PROFILE---------------
const loadUserProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.session.userId;

        if (!userId) return res.redirect('/login');

        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).send('User not found');

        res.render('user/profile', { user });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).send('Internal Server Error');
    }

};

//--------------------USER EDIT PROFILE-----------------
const loadUserEditProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.session.userId;
        if (!userId) return res.redirect('/auth/login');

        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).send("User not found");
        const phoneWithoutCode = user.phone ? user.phone.replace(/^\+91/, '') : '';

        res.render('user/editProfile', { user, phoneWithoutCode });
    } catch (error) {
        console.error('Error fetching user edit profile:', error);
        res.status(500).send('Internal Server Error');

    }

};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) return res.redirect("/auth/login");

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    const { name, gender, phone, removeImage, email } = req.body;

    if (name) user.name = name.trim();
    if (gender) user.gender = gender;
    if (phone) user.phone = "+91" + phone.replace(/^\+?91?/, "");

    // ===== UPDATE EMAIL ONLY IF VERIFIED =====
if (email !== user.email) {
  if (!req.session.emailVerified || req.session.newEmail !== email) {
    return res.redirect("/profile"); 
  }
  user.email = email;

  delete req.session.emailVerified;
  delete req.session.newEmail;
}

// --- REMOVE IMAGE ---
if (removeImage === "true" && user.image) {

    const oldFile = path.join(process.cwd(), "public", user.image);

    if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log("Deleted:", oldFile);
    }

    user.image = "";
}

// --- ADD / UPDATE CROPPED IMAGE ---
if (req.body.croppedImage) {
    // Delete old image if exists
    if (user.image) {
        const oldFile = path.join(process.cwd(), "public", user.image);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    // Save new cropped image
    const base64Data = req.body.croppedImage.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `/images/users/user_${user._id}_${Date.now()}.jpg`;
    const filePath = path.join(process.cwd(), "public", filename);

    fs.writeFileSync(filePath, buffer);
    user.image = filename;
}



    await user.save();
    res.redirect("/profile");

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).send("Internal Server Error");
  }
};



//---------------SEND EMAIL OTP------------
const sendEmailOtp = async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) return res.json({ success: false, message: "Email required" });
        const otp = generateOTP();
        req.session.emailOtp = otp;
        req.session.newEmail = newEmail;
 req.session.otpExpires = Date.now() + 1 * 60 * 1000;
        await sendOTPEmail(newEmail, otp);
        res.json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
        console.error("Error sending email OTP:", err);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
};

//------------RESEND EMAIL OTP---------
const resendEmailOtp = async (req, res) => {
    try {
        const email = req.session.newEmail;
        if (!email) return json({ success: false, message: "No email to resend OTP for" });
        const otp = generateOTP();
        req.session.emailOtp = otp;
        req.session.otpExpires = Date.now() + 1 * 60 * 1000;
        await sendOTPEmail(email, otp);
        res.json({ success: true, message: "OTP resent successfully!" })
    } catch (error) {
        console.error("Error resending email OTP:", error);
        res.status(500).json({ success: false, message: "Failed to resend OTP" });
    }
}

//------------VERIFY EMAIL OTP------------
const verifyEmailOtp = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const { otp } = req.body;

    if (!req.session.emailOtp) {
      return res.json({ success: false, message: "OTP not generated" });
    }

    if (!req.session.otpExpires || Date.now() > req.session.otpExpires) {
      return res.json({ success: false, message: "OTP expired" });
    }

    if (String(otp) !== String(req.session.emailOtp)) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // Mark email verified
    req.session.emailVerified = true;

    // Clear OTP
    delete req.session.emailOtp;
    delete req.session.otpExpires;

    return res.json({ success: true, message: "Email verified successfully" });

  } catch (err) {
    console.error("Verify email OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



const loadChangePasswordPage = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.redirect('/auth/login');

    res.render('user/profile_changePassword', { user: req.user });
  } catch (error) {
    console.error('Error loading change password page:', error);
    res.status(500).render('error', { message: 'Failed to load change password page.' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.json({ success: false, message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.json({ success: false, message: 'New passwords do not match' });
    }

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
const checkCurrentPassword = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    const { currentPassword } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "User not logged in" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect current password" });
    }

    return res.json({ success: true });

  } catch (error) {
    console.error("Password check error:", error);
    return res.json({ success: false, message: "Server error" });
  }
};


module.exports = { loadUserProfile, loadUserEditProfile, updateUserProfile, sendEmailOtp, verifyEmailOtp, resendEmailOtp,
    loadChangePasswordPage, updatePassword, checkCurrentPassword
 };