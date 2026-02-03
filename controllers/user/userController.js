const Product = require('../../models/productSchema');
const { applyBestOfferToProduct } = require("../../helpers/offerHelper");
const User = require("../../models/userSchema");


const loadHomepage = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.redirect("/auth/login");
 const user = await User.findById(userId);
if (!user) {
  req.logout(function (err) {
    if (err) {
      console.error("Logout error:", err);
    }

    req.session.destroy(() => {
      return res.redirect("/auth/login");
    });
  });

  return;
}

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