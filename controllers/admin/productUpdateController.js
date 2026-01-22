const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { deleteImage } = require('../../helpers/fileHelper');

// LOAD ADD PRODUCT PAGE
const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    res.render('admin/addProduct', { categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADD PRODUCT
const addProduct = async (req, res) => {
  try {
    const { main, gallery, variants } = req.body.processedImages || {};
    if (!main) return res.status(400).send("Main image is required");
    if (!gallery || gallery.length < 3) return res.status(400).send("Please upload at least 3 gallery images");

    const { product_name, brand, description, category_id, base_price, discount_percentage, isActive } = req.body;

    const finalPrice = parseFloat(base_price) - (parseFloat(base_price) * (parseFloat(discount_percentage) || 0) / 100);

    let total_stock = 0;
    if (req.body.variants) {
      Object.values(req.body.variants).forEach((v) => {
        v.stock = parseInt(v.stock) || 0;
        total_stock += v.stock;
      });
    }

    const product = new Product({
      category_id,
      product_name,
      brand,
      description,
      images: { main, gallery },
      base_price: parseFloat(base_price) || 0,
      discount_percentage: parseFloat(discount_percentage) || 0,
      final_price: parseFloat(finalPrice) || 0,
      total_stock,
      isActive: isActive === 'on'
    });

    const savedProduct = await product.save();

    // Save variants with images mapped by color
    if (req.body.variants && Object.keys(req.body.variants).length > 0) {
      const variantList = Object.entries(req.body.variants).map(([key, v]) => ({
        product_id: savedProduct._id,
        sku: v.sku,
        color: v.color,
        size: v.size,
        stock: parseInt(v.stock) || 0,
        image: req.body.processedImages.variants[key] || "",
        isActive: true
      }));
      await Variant.insertMany(variantList);
    }

    res.redirect("/admin/product-management");
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).send("Failed to add product");
  }
};

// LOAD EDIT PRODUCT PAGE
const loadEditProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send("Invalid product ID");

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).send("Product not found");
product.category_id = product.category_id?.toString();

    // Ensure images exist
    product.images = product.images || { main: '', gallery: [] };

    // Main image path
    if (product.images.main) {
      const mainPath = path.join(__dirname, '../../public', product.images.main);
      product.images.main = fs.existsSync(mainPath) ? '/' + product.images.main.replace(/^\/?/, '') : '';
    }

    // Gallery images
    if (Array.isArray(product.images.gallery)) {
      product.images.gallery = product.images.gallery
        .filter(img => fs.existsSync(path.join(__dirname, '../../public', img)))
        .map(img => '/' + img.replace(/^\/?/, ''));
    }

    // Categories
    const categories = await Category.find({ isActive: true }).lean();
    categories.forEach(cat => cat._id = cat._id.toString());

    // Variants
    const variants = await Variant.find({ product_id: productId }).lean();
    product.variants = variants.map(v => {
      let img = v.image || '';
      const imgPath = path.join(__dirname, '../../public', img);
      img = img && fs.existsSync(imgPath) ? '/' + img.replace(/^\/?/, '') : '';
      return { ...v, image: img };
    });

    res.render('admin/editProduct', { product, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// EDIT PRODUCT
const editProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).send("Product not found");

    const { product_name, brand, description, category_id, base_price, discount_percentage, isActive, variants } = req.body;

    // Update product fields
    product.product_name = product_name;
    product.brand = brand;
    product.description = description;
    product.category_id = category_id;
    product.base_price = parseFloat(base_price) || 0;
    product.discount_percentage = parseFloat(discount_percentage) || 0;
    product.final_price = product.base_price - (product.base_price * (product.discount_percentage || 0) / 100);
    product.isActive = isActive === 'on';

    const processed = req.body.processedImages || {};

    // Main image replacement
    if (processed.main && processed.main !== product.images.main) {
      if (product.images.main) deleteImage(product.images.main);
      product.images.main = processed.main;
    }

    // Gallery image replacement
    if (processed.gallery?.length) {
      processed.gallery.forEach(img => {
        const existingIndex = product.images.gallery.findIndex(g => g === img);
        if (existingIndex !== -1) {
          deleteImage(product.images.gallery[existingIndex]);
          product.images.gallery.splice(existingIndex, 1);
        }
      });
      product.images.gallery.push(...processed.gallery);
    }

    // Remove deleted gallery images
    if (req.body.removedImages) {
      const removed = JSON.parse(req.body.removedImages);
      product.images.gallery = product.images.gallery.filter(img => !removed.includes(img));
      removed.forEach(img => deleteImage(img));
    }

    await product.save();

    // Map variant images by color to preserve position
    const variantList = Array.isArray(variants) ? variants : Object.values(variants || {});
    const processedVariantsMap = {};
    if (processed.variants && Array.isArray(processed.variants)) {
      variantList.forEach((v, idx) => {
        processedVariantsMap[v.color] = processed.variants[idx] || v.existingImage || '';
      });
    }

    // Update / insert variants and remove old variant images if replaced
    for (const v of variantList) {
      const variantQuery = { color: v.color, size: v.size, product_id: productId };
      const existingVariant = await Variant.findOne(variantQuery);

      const newImage = processedVariantsMap[v.color] || v.existingImage || '';
      if (existingVariant && existingVariant.image && existingVariant.image !== newImage) {
        deleteImage(existingVariant.image);
      }

      await Variant.findOneAndUpdate(
        variantQuery,
        {
          color: v.color,
          size: v.size,
          stock: parseInt(v.stock) || 0,
          image: newImage,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }

    // Recalculate total stock
    const allVariants = await Variant.find({ product_id: productId });
    product.total_stock = allVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    await product.save();

    res.redirect('/admin/product-management');
  } catch (err) {
    console.error("Edit product error:", err);
    res.status(500).send("Server error");
  }
};

// REMOVE GALLERY IMAGE
const removeGalleryImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false });

    product.images.gallery = product.images.gallery.filter(img => img !== imageUrl);
    await product.save();
    deleteImage(imageUrl);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
};

module.exports = {
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  removeGalleryImage
};
