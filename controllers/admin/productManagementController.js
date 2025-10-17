const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');
const Category = require('../../models/categorySchema');
const mongoose = require('mongoose');


//PAGE LOADING
const loadProductManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 7;
        const skip = (page - 1) * limit;

        const { category, status } = req.query;
        const filter = { deleted: false };
        if (category && mongoose.Types.ObjectId.isValid(category)) {
            filter.category_id = new mongoose.Types.ObjectId(category);
        } if (status) {
            if (status === 'Listed') filter.isActive = true;
            else if (status === 'Unlisted') filter.isActive = false;
        }
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
                {
        $lookup: {
            from: 'variants',
            localField: '_id',
            foreignField: 'product_id',
            as: 'variants'
        }
    },
            {
                $addFields: {
                    total_stock: { $sum: '$variants.stock' },
                    category_name: { $arrayElemAt: ['$category.category', 0] },
                    isActive: { $ifNull: ['$isActive', true] },
                    status: { $cond: [{ $ifNull: ['$isActive', true] }, 'Listed', 'Unlisted'] },
                    statusClass: { $cond: [{ $ifNull: ['$isActive', true] }, 'list', 'unlist'] },
                    formattedDate: {
                        $dateToString: { format: "%d-%m-%Y", date: "$createdAt" }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    product_name: 1,
                    base_price: 1,
                    total_stock: 1,
                    category_name: 1,
                    formattedDate: 1,
                    status: 1,
                    statusClass: 1,
                    isActive: 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const categories = await Category.find().lean();
        res.render('admin/product_management', {
            products,
            categories,
            currentPage: page,
            totalPages,
            selectedCategory: category || '',
            selectedStatus: status || ''

        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');

    }
};

//TOGGLE
const toggleProductStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const { isActive } = req.body;
        console.log("Product req.body", req.body);

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.isActive = isActive;
        await product.save();
        res.json({
            success: true,
            message: isActive ? 'Product listed' : 'Product unlisted',
            isActive: product.isActive
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });

    }
}

//DELETE 

const softDeleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        product.deleted = true;
        product.deletedAt = new Date();
        await product.save();
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}



module.exports = { loadProductManagement, toggleProductStatus, softDeleteProduct };