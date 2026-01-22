const loggedInUserRedirect = (req, res, next) => {
const token = req.cookies.user_jwt;
if(!token) return next();
try{
    jwt.verify(token, process.env.JWT_SECRET)
    return res.redirect('/');
} catch(err) {
    return next();
}
}

module.exports = loggedInUserRedirect;

