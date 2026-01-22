const express =require('express');
const router = express.Router();
const Product = require('../../models/productSchema');

const userController = require('../../controllers/user/userController');
const productController = require ('../../controllers/user/productController');
const { uploadUserImage, processUserImage } = require('../../middlewares/userImageMiddleware');
const userProfileController = require('../../controllers/user/userProfileController');
const cartController =  require('../../controllers/user/cartController');
const addressController = require('../../controllers/user/addressController')
const checkoutController = require('../../controllers/user/checkoutController');
const orderController = require('../../controllers/user/OrderController');
const { getOrderDetails } = require("../../controllers/user/orderDetailsController");
const {rateProduct} =require('../../controllers/user/orderDetailsController');
const { cancelOrderedItem } = require("../../controllers/user/orderDetailsController");
const {generateInvoice} = require('../../controllers/user/orderDetailsController')
const {returnOrderedItem} = require('../../controllers/user/orderDetailsController')
const wishlistController = require('../../controllers/user/wishlistController');
const authMiddleware = require('../../middlewares/userAuthMiddleware');
const userAuthMiddleware = require('../../middlewares/userAuthMiddleware');
const { createRazorPayOrder, verifyPayment, paymentFailed,retryPayment,verifyRetryPayment } = require('../../controllers/user/razorpayController'); // path to your controller
const walletController = require("../../controllers/user/walletController");
const {getCouponsPage, getAvailableCoupons} = require('../../controllers/user/couponController');
router.get('/',authMiddleware, userController.loadHomepage );
router.get('/products',authMiddleware, productController.loadProductsPage);
router.get('/product/:productId/get-stock/:variantId',authMiddleware, productController.getVariantStock);
router.get('/stock/:productId/:variantId',authMiddleware, productController.getLiveStock);



router.get('/product/:productId',authMiddleware, productController.LoadProductDetailsPage);
router.post('/add-to-cart', authMiddleware, cartController.addToCart)

router.get('/cart',cartController.loadCart);
router.patch("/cart/update-quantity", cartController.updateQuantity);
router.delete("/cart/remove-item", cartController.removeItem);
router.get('/cart/select-address', addressController.loadSelectAddressPage);
router.delete('/cart/select-address/delete/:id', addressController.deleteAddress);
router.post('/cart/select-address',  authMiddleware, addressController.selectAddress );
router.get('/checkout/select-address', addressController.loadSelectAddressPage);
router.post('/checkout/select-address', addressController.selectAddress);
router.get('/cart/count', cartController.getCartCount);
router.post("/cart/check-stock-before-order", cartController.checkStockBeforeOrder);
router.get("/available-coupons",  getAvailableCoupons);



router.get('/profile', userAuthMiddleware, userProfileController.loadUserProfile);
router.get('/profile/edit-profile', userProfileController.loadUserEditProfile);
router.post('/profile/edit-profile',uploadUserImage.single('image'), processUserImage, userProfileController.updateUserProfile);
router.post("/profile/edit-profile/send-email-otp", userProfileController.sendEmailOtp);
router.post("/profile/edit-profile/verify-email-otp", userProfileController.verifyEmailOtp);
router.post('/profile/edit-profile/resend-email-otp', userProfileController.resendEmailOtp);
router.get('/profile/change-password', userProfileController.loadChangePasswordPage);
router.post('/profile/change-password', userProfileController.updatePassword);
router.post("/check-current-password", userAuthMiddleware, userProfileController.checkCurrentPassword);
router.get('/address',  addressController.loadAddressPage)
router.get('/address/add',  addressController.loadAddAddressPage);
router.post('/address/add',  addressController.addAddress);
router.get('/address/edit/:id', addressController.loadEditAddress)
router.put("/address/edit/:id", addressController.updateAddress);
router.delete("/address/delete/:id", addressController.deleteAddress);


router.get('/checkout', userAuthMiddleware, checkoutController.loadCheckOutPage);
router.post('/checkout/apply-coupon', userAuthMiddleware, checkoutController.applyCoupon);
router.post('/checkout/place-order', userAuthMiddleware, checkoutController.placeOrder);
router.get("/checkout/available-coupons", userAuthMiddleware, checkoutController.getAvailableCoupons);
// userRouter.js
router.get('/get-cart-count', userAuthMiddleware, cartController.getCartCount); 




router.get('/orders', orderController.loadOrdersPage);
router.get("/order-success/:id", orderController.loadOrderSuccessPage);
router.post('/orders/cancel-order/:orderId', orderController.cancelEntireOrder);
router.post('/orders/cancel-item/:itemId', orderController.cancelOrderedItem);
router.get('/orders/:orderId/item/:itemId', userAuthMiddleware, getOrderDetails);

router.get('/count', cartController.getCartCount);
router.post("/rate-product", rateProduct);
router.post('/orders/cancel-item/:itemId', orderController.cancelOrderedItem);
 router.get("/orders/:orderId/invoice", userAuthMiddleware, generateInvoice);
router.post("/return-order/:itemId", returnOrderedItem)
router.post('/orders/:orderId/return-order', orderController.returnEntireOrder)


router.get('/wishlist', wishlistController.loadWishlistPage)
router.get("/wishlist/all", wishlistController.getAllWishlist);
router.post("/wishlist/toggle/:productId", wishlistController.toggleWishlist);

router.delete(
  "/wishlist/remove/:productId",
  userAuthMiddleware,    
  wishlistController.removeWishlistItem
);

//RAZORPAY
// router.post('/razorpay/create-order', createRazorPayOrder);
// router.post('/razorpay/verify-payment', verifyPayment);
// router.post("/razorpay/payment-failed", paymentFailed);
router.post(
  '/razorpay/verify-payment',
  userAuthMiddleware,
  verifyPayment
);

router.post(
  '/razorpay/create-order',
  userAuthMiddleware,
  createRazorPayOrder
);
router.post("/razorpay/payment-failed", paymentFailed);

router.post("/razorpay/retry-payment", retryPayment);          
router.post("/razorpay/verify-retry-payment", verifyRetryPayment); 




//WALLET
router.get("/wallet",walletController.loadWalletPage);
router.post("/checkout/wallet-order", checkoutController.createWalletOrder);
router.post("/wallet/check-balance", userAuthMiddleware, checkoutController.checkWalletBalance);




//COUPON
router.get('/coupons',getCouponsPage);


module.exports = router; 
