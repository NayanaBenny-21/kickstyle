const express =require('express');
const router = express.Router();
const Product = require('../../models/productSchema');
const userController = require('../../controllers/user/userController');
const productController = require ('../../controllers/user/productController');
const { uploadUserImage, processUserImage } = require('../../middlewares/userImageMiddleware');
const userProfileController = require('../../controllers/user/userProfileController');
const cartController =  require('../../controllers/user/cartController');
const addressController = require('../../controllers/user/addressController')
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/', userController.loadHomepage );
router.get('/products', productController.loadProductsPage);

router.get('/product/:productId', productController.LoadProductDetailsPage);
router.post('/add-to-cart', authMiddleware, cartController.addToCart)

router.get('/cart',cartController.loadCart);
router.patch("/cart/update-quantity", cartController.updateQuantity);
router.delete("/cart/remove-item", cartController.removeItem);

router.get('/profile', userProfileController.loadUserProfile);
router.get('/profile/edit-profile', userProfileController.loadUserEditProfile);
router.post('/profile/edit-profile',uploadUserImage.single('image'), processUserImage, userProfileController.updateUserProfile);
router.post("/profile/edit-profile/send-email-otp", userProfileController.sendEmailOtp);
router.post("/profile/edit-profile/verify-email-otp", userProfileController.verifyEmailOtp);
router.post('/profile/edit-profile/resend-email-otp', userProfileController.resendEmailOtp);

router.get('/address',  addressController.loadAddressPage)
router.get('/address/add',  addressController.loadAddAddressPage);
router.post('/address/add',  addressController.addAddress);
router.get('/address/edit/:id', addressController.loadEditAddress)
router.put("/address/edit/:id", addressController.updateAddress);
router.delete("/address/delete/:id", addressController.deleteAddress);


module.exports = router; 
