const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Upload directory
const uploadDir = path.join(__dirname, "../images/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config (store in memory for Sharp)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'), false);
    }
    cb(null, true);
  },
});

const processProductImages = async (req, res, next) => {
  try {
    if (!req.files) return next();

    const processed = {
      main: null,
      gallery: [],
      variants: [], // ✅ make this an array, not an object
    };

    // ✅ Handle main image
    if (req.files.main?.[0]) {
      const file = req.files.main[0];
      const filename = `main-${Date.now()}.jpeg`;
      const filepath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(filepath);

      processed.main = `/images/products/${filename}`;
    }

    // ✅ Handle gallery images
    if (req.files.images?.length) {
      for (const file of req.files.images) {
        const filename = `gallery-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpeg`;
        const filepath = path.join(uploadDir, filename);

        await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toFile(filepath);

        processed.gallery.push(`/images/products/${filename}`);
      }
    }

    // ✅ Handle variant images
    if (req.files.variantImages?.length) {
      for (let i = 0; i < req.files.variantImages.length; i++) {
        const file = req.files.variantImages[i];
        const filename = `variant-${i}-${Date.now()}.jpeg`;
        const filepath = path.join(uploadDir, filename);

        await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toFile(filepath);

        processed.variants.push(`/images/products/${filename}`); // ✅ now valid
      }
    }

    req.body.processedImages = processed;
    next();
  } catch (err) {
    console.error('Image processing error:', err);
    res.status(500).send('Image processing failed');
  }
};

module.exports = { upload, processProductImages };
