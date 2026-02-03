const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema');
const { applyBestOfferToProduct } = require("../../helpers/offerHelper");

const loadCategoryProducts = async (req, res) => {
  try {
    const categoryName = req.params.category.toLowerCase();
    const { brand, color, size, sort, page = 1 } = req.query;

    const limit = 4;
    const skip = (page - 1) * limit;

    // ------------------ Find Category ------------------
    const categoryDoc = await Category.findOne({
      category: categoryName,
      isActive: true,
      deleted: false
    });

    if (!categoryDoc) {
      return res.status(404).send("Category not found");
    }

    // ------------------ Base Filter ------------------
    let filter = {
      category_id: categoryDoc._id,
      isActive: true,
      deleted: false
    };

    // ------------------ Variant Filter ------------------
    if (color || size) {
      const variantFilter = {};

      if (color) variantFilter.color = { $in: [].concat(color) };
      if (size) variantFilter.size = { $in: [].concat(size) };

      const variantProductIds = await Variant
        .find({ ...variantFilter, isActive: true })
        .distinct("product_id");

      filter._id = variantProductIds.length
        ? { $in: variantProductIds }
        : { $in: ["000000000000000000000000"] };
    }

    // ------------------ Brand Filter ------------------
    if (brand) {
      filter.brand = { $in: [].concat(brand) };
    }

    // ------------------ SORTING (DB LEVEL) ------------------
    let sortQuery = { createdAt: -1 }; // default: newest

if (sort === "priceLowHigh") sortQuery = { final_price: 1 };
if (sort === "priceHighLow") sortQuery = { final_price: -1 };


    // ------------------ Fetch Products (SORT → PAGINATE) ------------------
    let dbProducts = await Product.find(filter)
      .sort(sortQuery)       
      .skip(skip)
      .limit(limit)
      .lean();

    // ------------------ Apply Offers ------------------
    dbProducts = await Promise.all(
      dbProducts.map(p => applyBestOfferToProduct(p))
    );

    // ------------------ Normalize Images ------------------
    dbProducts = dbProducts.map(p => {
      if (!p.images) p.images = {};

      if (!p.images.main) {
        p.images.main = "/images/default-product.jpg";
      } else if (!p.images.main.startsWith("/")) {
        p.images.main = "/" + p.images.main;
      }

      if (!Array.isArray(p.images.gallery)) {
        p.images.gallery = [];
      } else {
        p.images.gallery = p.images.gallery.map(img =>
          img.startsWith("/") ? img : "/" + img
        );
      }

      return p;
    });

    // ------------------ Sidebar Filters (Category only) ------------------
    const categoryProductIds = await Product.find({
      category_id: categoryDoc._id,
      isActive: true,
      deleted: false
    }).distinct("_id");

    const brands = await Product.find({
      _id: { $in: categoryProductIds }
    }).distinct("brand");

    const colors = await Variant.find({
      product_id: { $in: categoryProductIds },
      isActive: true
    }).distinct("color");

    const sizes = await Variant.find({
      product_id: { $in: categoryProductIds },
      isActive: true
    }).distinct("size");

    // ------------------ Pagination Count ------------------
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // ------------------ Render ------------------
    res.render("user/categoryProducts", {
      products: dbProducts,
      selectedCategory: categoryName,
      sort,
      selectedFilters: req.query,
      currentPage: Number(page),
      totalPages,
      brands,
      colors,
      sizes
    });

  } catch (error) {
    console.error("Error loading category products:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = { loadCategoryProducts };
