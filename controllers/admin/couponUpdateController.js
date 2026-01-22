const Coupon = require('../../models/couponSchema');

// Load edit page
const loadEditCouponPage = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const coupon = await Coupon.findById(couponId).lean();
    if (!coupon) return res.status(404).send("Coupon not found");

    if (coupon.startDate) coupon.startDate = coupon.startDate.toISOString().split('T')[0];
    if (coupon.expiryDate) coupon.expiryDate = coupon.expiryDate.toISOString().split('T')[0];

    coupon.isActive = Boolean(coupon.isActive);

    const errors = req.session.errors || {};
    const formData = req.session.formData || {};

    delete req.session.errors;
    delete req.session.formData;

    res.render('admin/editCoupon', {
      coupon: Object.keys(formData).length ? { ...coupon, ...formData } : coupon,
      errors
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const existingCoupon = await Coupon.findById(couponId).lean();
    if (!existingCoupon) return res.status(404).send("Coupon not found");

    const {
      name,
      couponCode,
      description,
      discountType,
      discountValue,
      minOrder,
      maxDiscount,
      limit,
      perUserLimit,
      startDate,
      expiryDate,
      termsAndConditions,
      isActive
    } = req.body;

    const errors = {};

    const termsArray = Array.isArray(termsAndConditions)
      ? termsAndConditions
      : [termsAndConditions];

    const cleanedTerms = termsArray.map(t => t?.trim());

    // ================= VALIDATIONS =================
    if (!name || name.trim() === "") errors.name = "Coupon name is required";
    if (!couponCode || couponCode.trim() === "") errors.couponCode = "Coupon code is required";
    if (!description || description.trim() === "") errors.description = "Description is required";
    if (!discountType) errors.discountType = "Select a discount type";

    if (discountType === "percentage") {
      if (!discountValue || discountValue <= 0 || discountValue > 100)
        errors.discountValue = "Percentage discount must be between 1 and 100";
      if (!maxDiscount || maxDiscount <= 0)
        errors.maxDiscount = "Max discount is required for percentage coupons";
    }

    if (discountType === "flat") {
      if (!discountValue || discountValue <= 0)
        errors.discountValue = "Flat discount must be greater than 0";
    }

    if (minOrder < 0) errors.minOrder = "Minimum order cannot be negative";
    if (!limit || limit <= 0) errors.limit = "Total usage limit must be greater than 0";
    if (!perUserLimit || perUserLimit <= 0) errors.perUserLimit = "Per user limit must be greater than 0";
    if (!startDate) errors.startDate = "Start date is required";
    if (!expiryDate) errors.expiryDate = "Expiry date is required";
    if (startDate && expiryDate && new Date(startDate) >= new Date(expiryDate))
      errors.expiryDate = "Expiry date must be after start date";

    // Check for empty T&C
    if (cleanedTerms.length === 0 || cleanedTerms.every(t => !t))
      errors.terms = "At least one Terms & Conditions point is required";

    // ================= HANDLE ERRORS =================
    if (Object.keys(errors).length > 0) {
      return res.render("admin/editCoupon", {
        coupon: {
          _id: couponId,
          couponName: name,
          couponCode,
          description,
          discountType,
          discountValue,
          minOrderAmount: minOrder,
          maxDiscountAmount: maxDiscount,
          usageLimit: limit,
          perUserLimit,
          startDate,
          expiryDate,
          terms: cleanedTerms,
          isActive: isActive === "true"
        },
        errors
      });
    }

    // ================= UPDATE =================
    await Coupon.findByIdAndUpdate(couponId, {
      couponName: name.trim(),
      couponCode: couponCode.trim(),
      description: description.trim(),
      discountType,
      discountValue,
      minOrderAmount: minOrder,
      maxDiscountAmount: maxDiscount,
      usageLimit: limit,
      perUserLimit,
      startDate,
      expiryDate,
      terms: cleanedTerms.filter(t => t),
      isActive: isActive === "true"
    });

    res.redirect("/admin/coupon-management");

  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
};


const loadAddCouponPage = async (req, res) => {
  try {
    res.render('admin/addNewCoupon.hbs')
  } catch (error) {
    console.error("Loading add new coupon page : ", error);
    res.status(500).send("Something went wrong");
  }
}

const addNewCoupon = async (req, res) => {
  try {
    const data = {
      couponName: req.body.name,
      couponCode: req.body.couponCode,
      description: req.body.description,
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      minOrderAmount: req.body.minOrder,
      maxDiscountAmount: req.body.maxDiscount,
      usageLimit: req.body.limit,
      perUserLimit: req.body.perUserLimit,
      startDate: req.body.startDate,
      expiryDate: req.body.expiryDate,
      terms: req.body.termsAndConditions || [],
      isActive: req.body.isActive === "true" ? true : false
    };


    await Coupon.create(data);

 
    res.redirect('/admin/coupon-management');
  } catch (error) {
    console.error("Adding new coupon error:", error);
    res.status(500).send("Something went wrong");
  }
};

module.exports = { loadEditCouponPage, editCoupon, loadAddCouponPage, addNewCoupon };