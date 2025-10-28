
const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema');
const loadProductsPage = async (req, res) => {
    try {
        const sortQuery = req.query.sort || 'newest'; // default to newest
        console.log("Sort query:", sortQuery);

        // Ensure  sorting 
        let sortOption;
        switch (sortQuery) {
            case 'priceLowHigh':
                sortOption = { final_price: 1, _id: 1 };
                break;
            case 'priceHighLow':
                sortOption = { final_price: -1, _id: 1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1, _id: 1 };
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        //variant filtering
        const variantFilter = {};
        if (req.query.color) variantFilter.color = { $in: Array.isArray(req.query.color) ? req.query.color : [req.query.color] };
        if (req.query.size) variantFilter.size = { $in: Array.isArray(req.query.size) ? req.query.size : [req.query.size] };

        let productIds = [];
        if (Object.keys(variantFilter).length) {
            const variants = await Variant.find(variantFilter).distinct('product_id')
            productIds = variants;
        }

        const productFilter = { isActive: true };

        if (productIds.length) productFilter._id = { $in: productIds }
        if (req.query.category) {
            productFilter.category_id = { $in: Array.isArray(req.query.category) ? req.query.category : [req.query.category] };
        }
        if (req.query.brand) {
            productFilter.brand = { $in: Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand] };
        }
        const totalProducts = await Product.countDocuments(productFilter);
        const totalPages = Math.ceil(totalProducts / limit)

        const loadProducts = await Product.find(productFilter).sort(sortOption).skip(skip).limit(limit).lean();
        const product = loadProducts.map((p) => ({
            _id: p._id,
            name: p.product_name,
            brand: p.brand,
            price: p.base_price,
            offerPrice: p.final_price,
            discountPercentage: p.discount_percentage,
            images: p.images
        }));
        const categories = await Category.find({ isActive: true }).lean();
        const brands = await Product.distinct('brand');
        const colors = await Variant.distinct('color');
        const sizes = await Variant.distinct('size');
        res.render('user/allProductsPage', {
            products: product, currentPage: page, totalPages, sort: sortQuery || 'newest', selectedFilters: req.query,
            categories, brands, colors, sizes
        });
    } catch (error) {
        console.error("Error loading productpage:", error);
        res.status(500).send("Server error");
    }
};


const LoadProductDetailsPage = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId).lean();

    if (!product) return res.status(404).send("Product not found");

    // --- Description ---
    let descriptionList = [];
    if (product.description) {
      descriptionList = product.description
        .split(/[\r\n]+|\. +/)
        .map(item => item.trim())
        .filter(Boolean);
    }

    // --- Variants ---
    const variants = await Variant.find({ product_id: productId, isActive: true }).lean();

    const sizesWithStock = variants.map(v => ({
      size: v.size,
      color: v.color,
      stock: v.stock,
      variantId: v._id
    }));

    const colors = [...new Set(variants.map(v => v.color))];
    const sizes = [...new Set(variants.map(v => v.size))];

    // --- Color Images ---
    const colorImages = {};
    variants.forEach(v => {
      if (!colorImages[v.color]) {
        let img = v.image || '/images/default-product.jpg';
        if (!img.startsWith('/')) img = '/' + img;
        colorImages[v.color] = img;
      }
    });

    // --- Images ---
    const images = {
      main: '/images/default-product.jpg',
      gallery: []
    };
    if (product.images?.main) {
      let mainImg = product.images.main.trim();
      if (!mainImg.startsWith('/')) mainImg = '/' + mainImg;
      images.main = mainImg;
    }
    if (Array.isArray(product.images?.gallery)) {
      images.gallery = product.images.gallery
        .map(img => img.trim())
        .filter(Boolean)
        .map(img => img.startsWith('/') ? img : '/' + img);
    }

    // --- Similar products ---
    const similarProducts = await Product.find({ _id: { $ne: product._id }}).limit(4).lean();
    similarProducts.forEach(p => {
      if (p.images?.main && !p.images.main.startsWith('/')) {
        p.images.main = '/' + p.images.main;
      } else if (!p.images?.main) {
        p.images.main = '/images/default-product.jpg';
      }
    });

  
    res.render('user/productDetails', {
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

module.exports = { loadProductsPage, LoadProductDetailsPage };