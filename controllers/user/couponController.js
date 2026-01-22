const CouponUsage = require("../../models/couponUsageSchema");
const Coupon = require("../../models/couponSchema");

exports.getCouponsPage = async (req, res) => {
  try {
    const userId = req.session.userId; // ✅ FIX HERE

    if (!userId) {
      return res.redirect("/auth/login");
    }

    const today = new Date();

    // 1️⃣ Coupons already used by this user
    const usedCoupons = await CouponUsage.find({ userId })
      .select("couponCode")
      .lean();

    const usedCouponCodes = usedCoupons.map(c => c.couponCode);

    // 2️⃣ Fetch ONLY available coupons
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: today },
      couponCode: { $nin: usedCouponCodes }
    }).lean();

    console.log("Available coupons:", coupons);

    res.render("user/coupons", { coupons });

  } catch (error) {
    console.error("Coupon page error:", error);
    res.render("user/coupons", { coupons: [] });
  }
};

exports.getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: now },
    }).lean();

    res.json({
      success: true,
      coupons
    });

  } catch (err) {
    console.error("Available coupons error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
