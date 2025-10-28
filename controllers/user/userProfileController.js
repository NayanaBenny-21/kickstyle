const { json } = require('express');
const { generateOTP, sendOTPEmail } = require('../../helpers/otp_email');
const User = require('../../models/userSchema');


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
        const userId = req.user ? req.user.id : req.session.userId;
        if (!userId) return res.redirect('/auth/login');

        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        const { name, gender, phone } = req.body;
        if (name) user.name = name.trim();
        if (gender) user.gender = gender;
        if (req.body.image) user.image = req.body.image;
        if (req.session.emailVerified && req.session.newEmail) {
            user.email = req.session.newEmail;
            req.session.newEmail = null;
            req.session.emailOtp = null;
            req.session.emailVerified = null;
        }
        if (phone) {
            let cleanedPhone = phone.startsWith("+91") ? phone : "+91" + phone.replace(/^\+?91?/, "");
            const numberPart = cleanedPhone.replace(/^\+91/, "");
            if (!/^\d{10}$/.test(numberPart)) {
                return res.status(400).send("Invalid phone number. Must be 10 digits.");
            }
            const existingUser = await User.findOne({ phone: cleanedPhone });
            if (existingUser && existingUser._id.toString() !== userId.toString()) {
                return res.status(400).send("Phone number already in use");
            }
            user.phone = cleanedPhone;
        }
        await user.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error for loading edit profile');
        res.status(500).send('Internal server error');

    }
}

//---------------SEND EMAIL OTP------------
const sendEmailOtp = async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) return res.json({ success: false, message: "Email required" });
        const otp = generateOTP();
        req.session.emailOtp = otp;
        req.session.newEmail = newEmail;

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
        const { otp } = req.body;
        if (req.session.emailOtp && req.session.emailOtp === otp) {
            const user = await User.findById(req.session.userId);
            user.email = req.session.newEmail;
            req.session.emailVerified = true;
            res.json({ success: true, message: "Email updated successfully!" });
        } else {
            res.json({ success: false, message: "Invalid OTP" });
        }

    } catch (error) {
        console.error("Error verifying email OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { loadUserProfile, loadUserEditProfile, updateUserProfile, sendEmailOtp, verifyEmailOtp, resendEmailOtp };