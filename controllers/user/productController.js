
const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema');
const { applyBestOfferToProduct } = require("../../helpers/offerHelper");



const loadProductsPage = async (req, res) => {
  try {
    const sortQuery = req.query.sort || "newest";

    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    // ---------- Variant filtering ----------
    const variantFilter = {};
    if (req.query.color)
      variantFilter.color = { $in: [].concat(req.query.color) };
    if (req.query.size)
      variantFilter.size = { $in: [].concat(req.query.size) };

    let productIds = [];
    if (Object.keys(variantFilter).length) {
      productIds = await Variant.find(variantFilter).distinct("product_id");
    }

    // ---------- Product filtering ----------
    const productFilter = { isActive: true, deleted: false };

    if (productIds.length) productFilter._id = { $in: productIds };
    if (req.query.category)
      productFilter.category_id = { $in: [].concat(req.query.category) };
    if (req.query.brand)
      productFilter.brand = { $in: [].concat(req.query.brand) };

    // ✅ 1️⃣ GET ALL FILTERED PRODUCTS (NO skip, NO limit)
    let allProducts = await Product.find(productFilter).lean();

    // ✅ 2️⃣ APPLY OFFER TO ALL
    let productsWithOffers = await Promise.all(
      allProducts.map(p => applyBestOfferToProduct(p))
    );

    // ✅ 3️⃣ SORT ALL PRODUCTS GLOBALLY
    if (sortQuery === "priceLowHigh") {
      productsWithOffers.sort((a, b) => a.final_price - b.final_price);
    } 
    else if (sortQuery === "priceHighLow") {
      productsWithOffers.sort((a, b) => b.final_price - a.final_price);
    } 
    else {
      productsWithOffers.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    // ✅ 4️⃣ NOW PAGINATE AFTER SORTING
    const totalProducts = productsWithOffers.length;
    const totalPages = Math.ceil(totalProducts / limit);

    const paginatedProducts = productsWithOffers.slice(skip, skip + limit);

    // ✅ 5️⃣ MAP FOR FRONTEND
    const products = paginatedProducts.map(p => ({
      _id: p._id,
      name: p.product_name,
      brand: p.brand,
      price: p.base_price,
      offerPrice: p.final_price,
      discountPercentage: p.discount_percentage,
      images: p.images
    }));

    const categories = await Category.find({ isActive: true }).lean();
    const brands = await Product.distinct("brand");
    const colors = await Variant.distinct("color");
    const sizes = await Variant.distinct("size");

    res.render("user/allProductsPage", {
      products,
      currentPage: page,
      totalPages,
      sort: sortQuery,
      selectedFilters: req.query,
      categories,
      brands,
      colors,
      sizes
    });

  } catch (error) {
    console.error("Error loading product page:", error);
    res.status(500).send("Server error");
  }
};



const LoadProductDetailsPage = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user?.id;
let product = await Product.findOne({ 
  _id: productId,
  isActive: true 
}).lean();

    if (!product) {
      return res.status(404).render("user/productUnavailable", {
        message: "Sorry, this product is no longer available."
      });
    }

    //  Apply offer (base_price → final_price)
    product = await applyBestOfferToProduct(product);

    // --- Description ---
    let descriptionList = [];
    if (product.description) {
      descriptionList = product.description
        .split(/[\r\n]+|\. +/)
        .map(item => item.trim())
        .filter(Boolean);
    }

    // --- Variants ---
    const variants = await Variant.find({
      product_id: productId,
      isActive: true
    }).lean();

    const sizesWithStock = variants.map(v => ({
      size: v.size,
      color: v.color,
      stock: Math.max(v.stock - (v.reservedStock || 0), 0),
      variantId: v._id
    }));

    const colors = [...new Set(variants.map(v => v.color))];

    // --- Color Images ---
    const colorImages = {};
    variants.forEach(v => {
      if (!colorImages[v.color]) {
        let img = v.image || "/images/default-product.jpg";
        if (!img.startsWith("/")) img = "/" + img;
        colorImages[v.color] = img;
      }
    });

    // --- Images ---
    const images = {
      main: "/images/default-product.jpg",
      gallery: []
    };

    if (product.images?.main) {
      images.main = product.images.main.startsWith("/")
        ? product.images.main
        : "/" + product.images.main;
    }

    if (Array.isArray(product.images?.gallery)) {
      images.gallery = product.images.gallery
        .map(img => img.trim())
        .filter(Boolean)
        .map(img => (img.startsWith("/") ? img : "/" + img));
    }

    // --- Similar products ---
    let similarProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true
    })
      .limit(4)
      .lean();

    // 🔥 Apply offer to similar products too
    similarProducts = await Promise.all(
      similarProducts.map(p => applyBestOfferToProduct(p))
    );

    // Image safety
    similarProducts.forEach(p => {
      if (!p.images?.main) {
        p.images = { main: "/images/default-product.jpg" };
      } else if (!p.images.main.startsWith("/")) {
        p.images.main = "/" + p.images.main;
      }
    });

    res.render("user/productDetails", {
      product: {
        ...product,
        description: descriptionList,
        colors,
        colorImages,
        images,
        sizesWithStock,
        selectedColor: colors[0] || null,
        stock: product.total_stock
      },
      similarProducts
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};
const getVariantStock = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    // Verify that the variant belongs to the product
    const variant = await Variant.findOne({
      _id: variantId,
      product_id: productId,
    }).lean();

    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    res.json({ success: true, stock: variant.stock });
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

//live stock update
const getLiveStock = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const variant = await Variant.findById(variantId).lean();
    const product = await Product.findById(productId).lean();

    if (!variant || !product) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    return res.json({
      success: true,
      variantStock: variant.stock,
      totalStock: product.total_stock
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
module.exports = { loadProductsPage, LoadProductDetailsPage, getVariantStock, getLiveStock };