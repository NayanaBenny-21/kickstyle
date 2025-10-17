const nodemailer = require('nodemailer');

function generateOTP() {
return  Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendOTPEmail(email, otp) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${otp}`
    });
}


module.exports = { generateOTP, sendOTPEmail };