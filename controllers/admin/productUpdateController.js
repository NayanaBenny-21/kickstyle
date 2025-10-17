const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { deleteImage } = require('../../helpers/fileHelper');
//ADD PRODUCT
const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    console.log(categories);
    res.render('admin/addProduct', { categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addProduct = async (req, res) => {
  try {
    // After processProductImages middleware, images are in req.body.processedImages
    const { main, gallery, variants } = req.body.processedImages || {};

    if (!main) return res.status(400).send("Main image is required");
    if (!gallery || gallery.length < 3) return res.status(400).send("Please upload at least 3 gallery images");

    const { product_name, brand, description, category_id, base_price, discount_percentage, isActive } = req.body;

    const finalPrice = parseFloat(base_price) - (parseFloat(base_price) * (parseFloat(discount_percentage) || 0) / 100);

    // Calculate total stock
    let total_stock = 0;
    if (req.body.variants) {
      Object.values(req.body.variants).forEach((v) => {
        v.stock = parseInt(v.stock) || 0;
        total_stock += v.stock;
      });
    }

    // Save product
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

    // Save variants
    if (req.body.variants && Object.keys(req.body.variants).length > 0) {
      const variantData = Object.entries(req.body.variants).map(([key, v]) => ({
        product_id: savedProduct._id,
        sku: v.sku,
        color: v.color,
        size: v.size,
        stock: parseInt(v.stock) || 0,
        image: req.body.processedImages.variants[key] || "",  // make sure key matches
        isActive: true
      }));

      await Variant.insertMany(variantData);
    }

    res.redirect("/admin/product-management");
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).send("Failed to add product");
  }
};

//EDIT PRODUCT
// Load edit form
const loadEditProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send("Invalid product ID");

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).send("Product not found");
    product.category_id = product.category_id.toString();
    const categories = await Category.find({ isActive: true }).lean();
   categories.forEach(cat => cat._id = cat._id.toString());
    const variants = await Variant.find({ product_id: productId }).lean();
    product.variants = variants.map(v => ({ ...v, image: v.image || '' }));

    res.render('admin/editProduct', { product, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Edit product
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

    // Remove deleted gallery images
    if (req.body.removedImages) {
      const removed = JSON.parse(req.body.removedImages);
      product.images.gallery = product.images.gallery.filter(img => !removed.includes(img));
      removed.forEach(img => deleteImage(img));
    }

    // Update main & gallery images
    const processed = req.body.processedImages || {};

    if (processed.main) product.images.main = processed.main;
    if (processed.gallery?.length)
      product.images.gallery.push(...processed.gallery);

    await product.save();

    // Update / insert variants
    const variantList = Array.isArray(variants)
      ? variants
      : Object.values(variants || {});
    const processedVariants = processed.variants || [];

    for (let idx = 0; idx < variantList.length; idx++) {
      const v = variantList[idx];
      const newImage =
        processedVariants[idx] || v.existingImage || product.image || "";

      await Variant.findOneAndUpdate(
        { sku: v.sku, product_id: productId },
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

// Remove gallery image
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
  loadAddProduct, addProduct,
  loadEditProduct, editProduct, removeGalleryImage
}