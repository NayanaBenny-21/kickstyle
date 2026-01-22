const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../public/images/users");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const uploadUserImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const processUserImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filename = `user-${Date.now()}.jpeg`;
    const finalPath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .resize(500, 500)
      .jpeg({ quality: 90 })
      .toFile(finalPath);

    req.body.image = `/images/users/${filename}`;
    next();
  } catch (err) {
    console.log("IMAGE PROCESS ERROR:", err);
    next(err);
  }
};

module.exports = { uploadUserImage, processUserImage };
