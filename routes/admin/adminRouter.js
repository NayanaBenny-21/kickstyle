const express = require('express');
const router = express.Router();

const userManagementController = require('../../controllers/admin/userManagementController');
const productManagementController = require('../../controllers/admin/productManagementController');
const { upload, processProductImages } = require('../../middlewares/imageUploadMiddleware');
const { loadAddProduct, addProduct, loadEditProduct, editProduct, removeGalleryImage } = require('../../controllers/admin/productUpdateController');
const { loadCategoryMangement, toggleCategoryStatus, softDeleteCategory } = require('../../controllers/admin/categoryManagementController');
const { loadAddCategory, addCategory, loadEditCategory, editCategory } = require('../../controllers/admin/categoryUpdateController');
const { imgUpload, processCategoryImage } = require('../../middlewares/categoryImageMiddleware');
const { loadOrderManagementPage, loadOrderDetailsPage, updateOrderedItemStatus, loadOrderedItemDetailsPage } = require('../../controllers/admin/orderManagmentController');
const { getAllOrdersById, getOrderlevelPage } = require('../../controllers/admin/order_managementontroller');
const { loadCouponsManagement, toggleCouponStatus, deleteCoupon } = require('../../controllers/admin/couponController');
const {loadEditCouponPage, editCoupon, loadAddCouponPage, addNewCoupon} = require('../../controllers/admin/couponUpdateController');
const {loadOfferManagement, toggleOfferStatus, deleteOffer} = require('../../controllers/admin/offerManagementController');
const {loadAddOffer, addOffer, loadEditOfferPage, editOffer} = require('../../controllers/admin/offerUpdateController');
const salesController  = require('../../controllers/admin/salesReportController');
const { getReportData } = require('../../controllers/admin/salesReportController');
const { generateSalesPdf } = require("../../controllers/utils/pdfGenerator");
const { generateSalesExcel } = require("../../controllers/utils/excelGenerator");
const {handleFullOrderReturn } = require("../../controllers/admin/order_managementontroller");

// ========== USER MANAGEMENT ==========
router.get('/user-management', userManagementController.loadUserManagement);
router.patch('/users/:userId/block', userManagementController.blockToggleUser);

// ========== PRODUCT MANAGEMENT ==========
router.get('/product-management', productManagementController.loadProductManagement);
router.patch('/products/:productId/toggle-status', productManagementController.toggleProductStatus);
router.patch('/products/:productId/delete', productManagementController.softDeleteProduct);

const imageUploads = upload.fields([
  { name: 'main', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'variantImages', maxCount: 10 },
]);

router.get('/products/add', loadAddProduct);
router.post('/products/add', imageUploads, processProductImages, addProduct);

router.get('/products/edit/:productId', loadEditProduct);
router.post('/products/edit/:productId', imageUploads, processProductImages, editProduct);
router.post('/products/:productId/remove-image', removeGalleryImage);

// ========== CATEGORY MANAGEMENT ==========
router.get('/category-management', loadCategoryMangement);
router.patch('/categories/:id/toggle-status', toggleCategoryStatus);
router.patch('/categories/:id/delete', softDeleteCategory);

router.get('/categories/add', loadAddCategory);
router.post('/categories/add', imgUpload.single('thumbnail'), processCategoryImage, addCategory);

router.get('/categories/edit/:categoryId', loadEditCategory);
router.post('/categories/edit/:categoryId', imgUpload.single('thumbnail'), processCategoryImage, editCategory);

// ========== ORDER MANAGEMENT ==========
router.get('/order-management', getAllOrdersById);
router.get('/order-management/order-details/:orderId', getOrderlevelPage);
router.get('/order-management/orderedItem-details/:itemId', loadOrderedItemDetailsPage);
// router.post('/orders/update-item-status/:itemId', updateOrderedItemStatus);
router.patch('/orders/update-item-status/:itemId', updateOrderedItemStatus);
router.patch('/orders/full-order-return/:orderId', handleFullOrderReturn);


// ========== COUPON MANAGEMENT ==========
router.get('/coupon-management', loadCouponsManagement);
router.patch('/coupon/:couponId/toggle', toggleCouponStatus);
router.patch('/coupon/:couponId/delete', deleteCoupon);
router.get('/coupon/edit/:couponId', loadEditCouponPage);
router.post('/coupon/edit/:couponId', editCoupon);
router.get('/coupon/add', loadAddCouponPage);
router.post('/coupon/add', addNewCoupon);

// ===========  OFFER MANAGEMENT =================
router.get('/offer-management', loadOfferManagement);
router.get('/offers/add', loadAddOffer);
router.post('/offers/add', addOffer);
router.get('/offers/edit/:offerId', loadEditOfferPage);
router.post('/offers/edit/:offerId', editOffer);
router.patch("/offers/toggle-status/:offerId",toggleOfferStatus);
router.delete('/offers/delete/:offerId', deleteOffer);

// ===========  SALES REPORT =================
router.get("/sales-report", salesController.getSalesReport);
// router.get("/sales-report/pdf", pdf.downloadPdf);
// router.get("/sales-report/excel", excel.downloadExcel);
router.get("/sales-report/pdf", async (req, res) => {
  const { orders, summary } = await getReportData(req);
  return generateSalesPdf(orders, summary, res);
});

router.get("/sales-report/excel", async (req, res) => {
  try {
    const { orders, summary } = await getReportData(req);
    return generateSalesExcel(orders, summary, res);
  } catch (err) {
    console.error("Excel route error:", err);
    res.status(500).send("Failed to download Excel");
  }
});



module.exports = router;
