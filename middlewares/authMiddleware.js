
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const token = req.cookies.jwt;

    if(!token) {
        return res.status(401).json({message : 'Unauthorized : No token provided'});
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Inavalid or expired'});
    }
}

module.exports = authMiddleware;