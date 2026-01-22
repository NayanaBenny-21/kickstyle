const Wishlist = require("../../models/wishlistSchema");
const Product  = require('../../models/productSchema');
const Variant = require("../../models/variantSchema");


/* =======================================================
   GET USER ID (COMMON FUNCTION)
======================================================= */
function getUserId(req) {
  return req.user ? req.user.id : req.session.userId;
}


/* =======================================================
   LOAD WISHLIST PAGE
======================================================= */
const loadWishlistPage = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.redirect("/auth/login");

    const userWishlist = await Wishlist.findOne({ user_id: userId });
    let wishlistProducts = [];

    if (userWishlist?.items?.length > 0) {
      const productIds = userWishlist.items.map(i => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();

      wishlistProducts = await Promise.all(
        products.map(async p => {
          const variants = await Variant.find({ product_id: p._id, isActive: true }).lean();
          const color = variants[0]?.color || "N/A";
                   const sizes = variants
            .filter(v => v.color === color)
            .map(v => ({ size: v.size, stock: v.stock }));
          return { ...p, sizes, color, variants };
        })
      );
    }

    res.render("user/wishlist", { wishlistProducts });

  } catch (error) {
    console.error("Load Wishlist Error:", error);
    res.status(500).send("Server Error");
  }
};





const getAllWishlist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.json({ success: true, wishlist: [] });
    }

    const userWishlist = await Wishlist.findOne({ user_id: userId });

    const wishlistIds = userWishlist
      ? userWishlist.items.map(i => i.productId.toString())
      : [];

    return res.json({ success: true, wishlist: wishlistIds });

  } catch (error) {
    console.error("Get All Wishlist Error:", error);
    return res.json({ success: false });
  }
};

/* =======================================================
   TOGGLE WISHLIST (ADD / REMOVE)
======================================================= */
const toggleWishlist = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.redirect('/auth/login');

    const productId = req.params.productId;

    let userWishlist = await Wishlist.findOne({ user_id: userId });

    // Create wishlist if empty
    if (!userWishlist) {
      userWishlist = new Wishlist({
        user_id: userId,
        items: [{ productId }]
      });

      await userWishlist.save();
      return res.json({ success: true, action: "added" });
    }

    // Check if exists
    const exists = userWishlist.items.some(
      item => item.productId.toString() === productId
    );

    if (exists) {
      userWishlist.items = userWishlist.items.filter(
        item => item.productId.toString() !== productId
      );

      await userWishlist.save();
      return res.json({ success: true, action: "removed" });
    }

    // Add new
    userWishlist.items.push({ productId });
    await userWishlist.save();

    return res.json({ success: true, action: "added" });

  } catch (error) {
    console.error("Wishlist Toggle Error:", error);
    return res.json({ success: false, message: "Server Error" });
  }
};


/* =======================================================
   REMOVE SINGLE ITEM FROM WISHLIST
======================================================= */
const removeWishlistItem = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    const productId = req.params.productId;

    const userWishlist = await Wishlist.findOne({ user_id: userId });

    if (!userWishlist) {
      return res.json({ success: false, message: "Wishlist not found" });
    }

    userWishlist.items = userWishlist.items.filter(
      item => item.productId.toString() !== productId
    );

    await userWishlist.save();

    return res.json({ success: true, message: "Item removed" });

  } catch (error) {
    console.error("Wishlist Remove Error:", error);
    return res.json({ success: false, message: "Server Error" });
  }
};


/* =======================================================
   EXPORT MODULES
======================================================= */
module.exports = {
  loadWishlistPage,
  getAllWishlist,
  toggleWishlist,
  removeWishlistItem
};
