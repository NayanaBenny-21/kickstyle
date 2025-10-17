const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Define upload directory outside of OneDrive/public issues
const uploadDir = path.join(__dirname, "../images/category");

// Ensure folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for multer
const storage = multer.memoryStorage();
const imgUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
    cb(null, true);
  }
});

// Process category image
const processCategoryImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filename = `category-${Date.now()}.jpeg`;
    const filepath = path.join(uploadDir, filename);

    console.log('Saving thumbnail to:', filepath);

    await sharp(req.file.buffer)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toFile(filepath);

    // Store relative path for frontend usage
    req.body.thumbnail = `/images/category/${filename}`;

    next();
  } catch (err) {
    console.error('Category image processing failed:', err);
    res.status(500).send('Image processing failed');
  }
};

module.exports = { imgUpload, processCategoryImage };
