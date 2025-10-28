//---------------USER PROFILE UPLOAD MIDDLEWARE -------------

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

//upload directory for user profile images
const uploadDir = path.join(__dirname, '../images/users');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const uploadUserImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
            return callback(new Error('Only images allowed'), false);
        }
        callback(null, true);
    }

});

const processUserImage = async (req, res, next) => {
    try {
        if (!req.file) return next();
        const filename = `user-${Date.now()}.jpeg`;
        const filePath = path.join(uploadDir, filename);

        await sharp(req.file.buffer).resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 90 }).toFile(filePath);

        req.body.image = `/images/users/${filename}`;
        next();
    } catch (error) {
        console.error('Profile image processing error:', err);
        res.status(500).send('Profile image upload failed');
    }

}


module.exports = { uploadUserImage, processUserImage };