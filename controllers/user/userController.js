const Product = require('../../models/productSchema');
const { applyBestOfferToProduct } = require("../../helpers/offerHelper");

const loadHomepage = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.redirect("/auth/login");

    const featuredProducts = await Product.find({
      isActive: true,
      deleted: false
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

   
    const productsWithOffers = await Promise.all(
      featuredProducts.map(async (p) => {
        const updated = await applyBestOfferToProduct(p);

        return {
          _id: updated._id,
          name: updated.product_name,
          price: updated.base_price,                
          offerPrice: updated.final_price,           
          discountPercentage: updated.discount_percentage,
          images: updated.images
        };
      })
    );

    res.render("user/homePage", { products: productsWithOffers });

  } catch (error) {
    console.error("Error loading homepage:", error);
    res.status(500).send("Server error");
  }
};




module.exports = {loadHomepage};