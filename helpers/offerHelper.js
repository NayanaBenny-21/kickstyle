const Offer = require("../models/offerSchema");

const applyBestOfferToProduct = async (product) => {
  const now = new Date();
  const basePrice = product.base_price;

  let offerDiscountAmount = 0;
  let offerDiscountPercentage = 0;

  // 🔍 Find active offers (product + category)
  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { offerType: "product", products: product._id },
      { offerType: "category", category: product.category_id }
    ]
  }).lean();

  // 🟢 1. Find BEST offer discount
  for (const offer of offers) {
    let discountAmount = 0;

    if (offer.discountType === "percentage") {
      discountAmount = (basePrice * offer.discountValue) / 100;
    } else if (offer.discountType === "flat") {
      discountAmount = offer.discountValue;
    }

    if (discountAmount > offerDiscountAmount) {
      offerDiscountAmount = discountAmount;
      offerDiscountPercentage = Math.round(
        (discountAmount / basePrice) * 100
      );
    }
  }

  // 🟡 2. Product discount
  let productDiscountAmount = 0;
  let productDiscountPercentage = 0;

  if (product.discount_percentage > 0) {
    productDiscountPercentage = product.discount_percentage;
    productDiscountAmount =
      (basePrice * product.discount_percentage) / 100;
  }

  // 🔥 3. Pick the BEST discount
  let finalDiscountAmount;
  let finalDiscountPercentage;

  if (offerDiscountAmount > productDiscountAmount) {
    finalDiscountAmount = offerDiscountAmount;
    finalDiscountPercentage = offerDiscountPercentage;
  } else {
    finalDiscountAmount = productDiscountAmount;
    finalDiscountPercentage = productDiscountPercentage;
  }

  // 💰 4. Final price
  let finalPrice = basePrice - finalDiscountAmount;
  if (finalPrice < 0) finalPrice = 0;

  return {
    ...product,
    final_price: Math.round(finalPrice),
    discount_percentage: finalDiscountPercentage
  };
};

module.exports = { applyBestOfferToProduct };
