const Offer = require('../../models/offerSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');

/* ----------------------------------------------------
   LOAD OFFER MANAGEMENT PAGE
---------------------------------------------------- */
const loadOfferManagement = async (req, res) => {
  try {
    const {
      page = 1,
      search = '',
      status,
      offerType,
      discountType
    } = req.query;

    const limit = 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.offerName = { $regex: search, $options: 'i' };
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    //  Offer type
    if (offerType) filter.offerType = offerType;

    //  Discount type
    if (discountType) filter.discountType = discountType;

    const totalOffers = await Offer.countDocuments(filter);

const rawOffers = await Offer.find(filter)
  .populate('category', 'name')
  .populate('products', 'productName basePrice')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();

// Format startDate and endDate without reassigning the const
const offers = rawOffers.map(p => ({
  ...p,
  startDateFormatted: p.startDate ? new Date(p.startDate).toLocaleDateString("en-GB") : '',
  endDateFormatted: p.endDate ? new Date(p.endDate).toLocaleDateString("en-GB") : ''
}));

    res.render('admin/offerManagement', {
      offers,
      currentPage: Number(page),
      totalPages: Math.ceil(totalOffers / limit),
      search,
      selectedStatus: status
    });

  } catch (error) {
    console.error(error);
    res.redirect('/admin/error');
  }
};

const toggleOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { isActive } = req.body;

    const offer = await Offer.findById(offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found"
      });
    }

    offer.isActive = isActive;
    await offer.save();

    res.json({
      success: true,
      message: "Offer status updated"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    await Offer.findByIdAndDelete(offerId);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



module.exports = {
  loadOfferManagement, toggleOfferStatus, deleteOffer}