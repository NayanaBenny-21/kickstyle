const express =require('express');
const router = express.Router();
const Product = require('../../models/productSchema');
const userController = require('../../controllers/user/userController');
const productController = require ('../../controllers/user/productController');
router.get('/', userController.loadHomepage );
router.get('/products', productController.loadProductsPage);

router.get('/product/:productId', productController.LoadProductDetailsPage);
module.exports = router; 