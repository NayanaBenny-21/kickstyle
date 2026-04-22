const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema'); // correct path
const mongoose = require('mongoose');

const loadProductManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    const skip = (page - 1) * limit;
    const { category, status, search } = req.query;

    const filter = { deleted: false };

    // Category filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category_id = new mongoose.Types.ObjectId(category);
    }

    // Status filter
    if (status) {
      filter.isActive = status === "Listed";
    }

    // Main query
    let products = await Product.find(filter)
      .populate("category_id") // populate category
      .sort({ createdAt: -1 })
      .lean();

    // Filter by search (product name OR category name)
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => {
        const productMatch = p.product_name.toLowerCase().includes(s);
        const categoryMatch = p.category_id?.category.toLowerCase().includes(s);
        return productMatch || categoryMatch;
      });
    }

    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / limit);

    // Pagination
    const paginatedProducts = products.slice(skip, skip + limit);

    // Compute total stock and other fields
    for (let p of paginatedProducts) {
      const variants = await Variant.find({ product_id: p._id }).lean();
      p.total_stock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      p.category_name = p.category_id?.category || "No Category";
      p.status = p.isActive ? "Listed" : "Unlisted";
      p.statusClass = p.isActive ? "list" : "unlist";
      p.formattedDate = p.createdAt.toLocaleDateString("en-GB");
    }

    const categories = await Category.find().lean();

    res.render("admin/product_management", {
      products: paginatedProducts,
      categories,
      currentPage: page,
      totalPages,
      selectedCategory: category || "",
      selectedStatus: status || "",
      search: search || "",
      noResults: paginatedProducts.length === 0 // flag for no results
    });

  } catch (error) {
    console.log("Error loading product management page:", error);
    res.status(500).send("Server Error");
  }
};


//TOGGLE
const toggleProductStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const { isActive } = req.body;
        console.log("Product req.body", req.body);

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.isActive = isActive;
        await product.save();
        res.json({
            success: true,
            message: isActive ? 'Product listed' : 'Product unlisted',
            isActive: product.isActive
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });

    }
}

//DELETE 

const softDeleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        product.deleted = true;
        product.deletedAt = new Date();
        await product.save();
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}



module.exports = { loadProductManagement, toggleProductStatus, softDeleteProduct };