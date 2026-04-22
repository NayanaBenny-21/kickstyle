// middlewares/editProductMulter.js
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Upload directories
const uploadDir = path.join(__dirname, "../public/images/products");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Memory storage
const storage = multer.memoryStorage();

// Flexible multer for edit
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
});

// Image processing middleware
const processProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    const processed = {
      main: null,
      gallery: [],
      variants: {} // 🔥 FIXED
    };

    for (const file of req.files) {
      const timestamp = Date.now();

      // MAIN IMAGE
      if (file.fieldname === 'main') {
        const filename = `main-${timestamp}.jpeg`;

        await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toFile(path.join(uploadDir, filename));

        processed.main = `/images/products/${filename}`;
      }

      // GALLERY
 else if (file.fieldname === 'galleryImages'){
const filename = `gallery-${Date.now()}-${Math.floor(Math.random() * 10000)}.jpeg`;
        await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toFile(path.join(uploadDir, filename));

        processed.gallery.push(`/images/products/${filename}`);
      }

      // 🔥 VARIANT IMAGES FIXED
      else if (file.fieldname.startsWith('variantImages')) {
        const filename = `variant-${timestamp}-${Math.floor(Math.random() * 1000)}.jpeg`;

        await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toFile(path.join(uploadDir, filename));

        const match = file.fieldname.match(/\[(\d+)\]/);

        if (match) {
          const index = match[1];
          processed.variants[index] = `/images/products/${filename}`;
        }
      }
    }

    req.body.processedImages = processed;

    console.log("PROCESSED IMAGES:", processed); // 🔥 DEBUG

    next();
  } catch (err) {
    console.error('Image processing error:', err);
  return res.status(500).json({
  success: false,
  message: 'Image processing failed'
});
  }
};

module.exports = { upload, processProductImages };