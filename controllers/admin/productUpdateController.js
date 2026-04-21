const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema');
const Brand = require("../../models/brandSchema");
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { deleteImage } = require('../../helpers/fileHelper');

// LOAD ADD PRODUCT PAGE
const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category
      .find({ isActive: true, isDeleted: { $ne: true } })
      .sort({ category: 1 })
      .lean();
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();

    res.render('admin/addProduct', { categories, brands });
  } catch (error) {
    console.error(error);
    return res.redirect('/admin/product-management?error=Server error');
  }
};

// ADD PRODUCT
const addProduct = async (req, res) => {
  try {
    const { main, gallery, variants } = req.body.processedImages || {};
    if (!main)
      return res.status(400).json({
        success: false,
        message: "Main image is required"
      });
    if (!gallery || gallery.length < 3)
      return res.status(400).json({
        success: false,
        message: "Please upload at least 3 gallery images"
      });

    const { product_name, brand, description, category_id, base_price, discount_percentage, isActive } = req.body;

    const finalPrice = parseFloat(base_price) - (parseFloat(base_price) * (parseFloat(discount_percentage) || 0) / 100);

    let total_stock = 0;
    if (req.body.variants) {
      Object.values(req.body.variants).forEach((v) => {
        v.stock = parseInt(v.stock) || 0;
        total_stock += v.stock;
      });
    }
    const normalizedBrand =
      brand.trim().charAt(0).toUpperCase() +
      brand.trim().slice(1).toLowerCase();

    const product = new Product({
      category_id,
      product_name,
      brand: normalizedBrand,
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
    res.status(500).json({
      success: false,
      message: "Failed to add product"
    });
  }
};

// LOAD EDIT PRODUCT PAGE
const loadEditProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send("Invalid product ID");

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.redirect('/admin/product-management?error=Product not found');
    }
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
    const categories = await Category
      .find({ isActive: true, isDeleted: { $ne: true } })
      .sort({ category: 1 })
      .lean();
    categories.forEach(cat => cat._id = cat._id.toString());

    // Variants
    const variants = await Variant.find({ product_id: productId }).lean();
    product.variants = variants.map(v => {
      let img = v.image || '';
      const imgPath = path.join(__dirname, '../../public', img);
      img = img && fs.existsSync(imgPath) ? '/' + img.replace(/^\/?/, '') : '';
      return { ...v, image: img };
    });
    const brands = [
      "Nike",
      "Adidas",
      "Puma",
      "Reebok",
      "New Balance",
      "Converse",
      "Vans"
    ];

    res.render('admin/editProduct', { product, categories, brands });
  } catch (err) {
    console.error(err);
    return res.redirect('/admin/product-management?error=Server error');
  }
};

// EDIT PRODUCT


const editProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }
    console.log("BODY VARIANTS:", JSON.stringify(req.body.variants, null, 2));
    console.log("FILES:", req.files);
    const {
      product_name,
      brand,
      description,
      category_id,
      base_price,
      discount_percentage,
      isActive,
    } = req.body;

    // UPDATE PRODUCT
    product.product_name = product_name;
    product.brand =
      brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
    product.description = description;
    product.category_id = category_id;
    product.base_price = parseFloat(base_price) || 0;
    product.discount_percentage = parseFloat(discount_percentage) || 0;

    product.final_price =
      product.base_price -
      (product.base_price * product.discount_percentage) / 100;

    product.isActive = isActive === "on";

    await product.save();

    const processedVariants = req.body.processedImages?.variants || {};

    for (const key in req.body.variants) {
      const v = req.body.variants[key];

      let imagePath = Array.isArray(v.existingImage)
        ? v.existingImage[0]
        : v.existingImage || null;

      //  USE PROCESSED IMAGE FROM MIDDLEWARE
      if (processedVariants[key]) {
        imagePath = processedVariants[key];

        if (v.existingImage) deleteImage(v.existingImage);
      }

      const data = {
        sku: v.sku,
        color: v.color,
        size: v.size,
        stock: parseInt(v.stock) || 0,
        image: imagePath,
        isActive: true
      };

      if (v._id) {
        await Variant.findByIdAndUpdate(v._id, data);
      } else {
        await Variant.create({ ...data, product_id: productId });
      }
    }


    //  UPDATE TOTAL STOCK
    const allVariants = await Variant.find({ product_id: productId });

    product.total_stock = allVariants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );

    const processedImages = req.body.processedImages || {};

    // ===== MAIN IMAGE =====
    if (processedImages.main) {
      // delete old
      if (product.images.main) {
        deleteImage(product.images.main);
      }

      product.images.main = processedImages.main;
    }
    let existingGallery = req.body.existingGallery || [];
    // normalize
    if (!Array.isArray(existingGallery)) {
      existingGallery = existingGallery ? [existingGallery] : [];
    }

    // NEW IMAGES (FROM SHARP)
    const newGalleryImages = processedImages.gallery || [];

    // DELETE REMOVED IMAGES
    if (Array.isArray(product.images.gallery)) {
      product.images.gallery.forEach(oldImg => {
        if (!existingGallery.includes(oldImg)) {
          deleteImage(oldImg);
        }
      });
    }

    //  FINAL MERGE
    product.images.gallery = [
      ...existingGallery,
      ...newGalleryImages
    ];

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (err) {
    console.error(err);

    res.json({
      success: false,
      message: err.message,
    });
  }
};
// Helper: delete image from server

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
