const express =require('express');
const router = express.Router();
const userManagementController = require('../../controllers/admin/userManagementController');
const productManagementController = require('../../controllers/admin/productManagementController');
const { upload, processProductImages } = require('../../middlewares/imageUploadMiddleware');
const { loadAddProduct, addProduct, loadEditProduct, editProduct, removeGalleryImage } = require('../../controllers/admin/productUpdateController');
const {loadCategoryMangement, toggleCategoryStatus, softDeleteCategory} = require('../../controllers/admin/categoryManagementController');
const { loadAddCategory, addCategory} = require('../../controllers/admin/categoryUpdateController')
const { imgUpload,  processCategoryImage } = require('../../middlewares/categoryImageMiddleware');
const { loadEditCategory, editCategory } = require ('../../controllers/admin/categoryUpdateController');

//USERMANAGEMENT
router.get('/user-management', userManagementController.loadUserManagement );
router.patch('/users/:userId/block', userManagementController.blockToggleUser);


//PRODUCTMANAGEMENT
router.get('/product-management', productManagementController.loadProductManagement);
router.patch('/products/:productId/toggle-status',productManagementController.toggleProductStatus);
router.patch('/products/:productId/delete', productManagementController.softDeleteProduct);

const imageUploads = upload.fields([
  { name: 'main', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'variantImages', maxCount: 10 },
]);
router.get('/products/add', loadAddProduct);
router.post('/products/add', imageUploads, processProductImages, addProduct);

router.get('/products/edit/:productId', loadEditProduct);
router.post('/products/edit/:productId', imageUploads, processProductImages, editProduct );
router.post('/products/:productId/remove-image', removeGalleryImage);

//CATEGORY MANAGEMENT
router.get('/category-management', loadCategoryMangement);
router.patch('/categories/:id/toggle-status', toggleCategoryStatus);
router.patch('/categories/:id/delete', softDeleteCategory);

router.get('/categories/add',loadAddCategory );
router.post('/categories/add', imgUpload.single('thumbnail'), processCategoryImage, addCategory);
router.get('/categories/edit/:categoryId', loadEditCategory);
router.post('/categories/edit/:categoryId', imgUpload.single('thumbnail'), processCategoryImage, editCategory);

module.exports = router;
