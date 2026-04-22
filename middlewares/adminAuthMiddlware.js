require('dotenv').config();

const adminAuthMiddlware = (req, res, next) => {
    const token = req.cookies.admin_jwt;
    if(!token) {
        return res.redirect('/adminAuth/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
    } catch (error) {
        
    }
}

module.exports = {adminAuthMiddlware};