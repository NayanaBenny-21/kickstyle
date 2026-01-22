const Coupon = require('../../models/couponSchema'); 


// Load Coupons Page
const loadCouponsManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { status, discountType, startDate, expiryDate, search } = req.query;
    const filter = { deleted: { $ne: true } }; // exclude deleted coupons

    // Filter by status
    if (status && status !== 'All') {
      filter.isActive = status.toLowerCase() === 'active';
    }

    // Filter by discount type
    if (discountType && discountType !== 'All') {
      filter.discountType = discountType.toLowerCase();
    }

    // Filter by search (coupon name or code)
    if (search && search.trim() !== '') {
      filter.$or = [
        { couponName: { $regex: search, $options: 'i' } },
        { couponCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by start date
    if (startDate) {
      filter.startDate = { $gte: new Date(startDate) };
    }

    // Filter by expiry date
    if (expiryDate) {
      filter.expiryDate = filter.expiryDate || {};
      filter.expiryDate.$lte = new Date(expiryDate);
    }

    // Total count for pagination
    const totalCoupons = await Coupon.countDocuments(filter);
    const totalPages = Math.ceil(totalCoupons / limit);

    // Fetch coupons with pagination
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format dates to dd-mm-yyyy
    const formattedCoupons = coupons.map(c => ({
      ...c,
      startDate: c.startDate ? c.startDate.toLocaleDateString("en-GB") : 'N/A',
      expiryDate: c.expiryDate ? c.expiryDate.toLocaleDateString("en-GB") : 'N/A',
      isActive: Boolean(c.isActive),
    }));

    res.render('admin/couponManagement', {
      coupons: formattedCoupons,
      currentPage: page,
      totalPages,
      selectedStatus: status || 'All',
      selectedDiscountType: discountType || 'All',
      startDate: startDate || '',
      expiryDate: expiryDate || '',
      search: search || ''
    });

  } catch (error) {
    console.error('Error loading coupons page:', error);
    res.status(500).send('Server Error');
  }
};

// Toggle Coupon Status
const toggleCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findById(couponId);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: coupon.isActive ? 'Coupon activated' : 'Coupon blocked',
      isActive: coupon.isActive
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete Coupon
const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findById(couponId);
    if (!coupon) return res.status(404).send('Coupon not found');

        coupon.deleted = true;
        coupon.deletedAt = new Date();
        await coupon.save(); 
          return res.json({
  success: true,
  message: "Coupon deleted successfully"
});

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  loadCouponsManagement,
  toggleCouponStatus,
  deleteCoupon
};
