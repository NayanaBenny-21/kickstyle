const mongoose = require('mongoose');
const Coupon = require('../models/couponSchema'); // Adjust the path to your coupon schema

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/kickstyle')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Function to create a coupon
const createCoupon = async () => {
  try {
    const newCoupon = new Coupon({
      couponName: "New Year Sale",
      description: "10% off on orders above ₹500",
      couponCode: "NY2025",
      discountType: "percentage", // or 'flat'
      discountValue: 10,           // 10% off
      minOrderAmount: 500,
      maxDiscountAmount: 200,
      usageLimit: 100,       // total uses allowed
      perUserLimit: 1,       // per user usage limit
      startDate: new Date("2025-11-01"),
      expiryDate: new Date("2025-12-31"),
      terms: ["Valid on selected items", "Cannot combine with other offers"],
      isActive: true
    });

    const savedCoupon = await newCoupon.save();
    console.log("Coupon created successfully:", savedCoupon);
    process.exit();
  } catch (err) {
    console.error("Error creating coupon:", err);
    process.exit(1);
  }
};

// Run the function
createCoupon();
