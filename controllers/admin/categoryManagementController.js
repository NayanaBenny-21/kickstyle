const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');

const loadCategoryMangement  = async (req, res) => {
    try {
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;
    console.log('Search value received:', search);

    const filter = { deleted: false };
   if (search && search.trim() !== '') {
      filter.category = { $regex: search.trim(), $options: 'i' };
    }
if (status) {
    if (status === 'Active') filter.isActive = true;
    else if (status === 'Blocked') filter.isActive = false;
}
        const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);
const categories = await Category.find(filter)
  .sort({ createdAt: -1, _id: -1 })
  .skip(skip).limit(limit).lean();
  
 for (let cat of categories) {
  cat.productCount = await Product.countDocuments({ category_id: cat._id });
}
 console.log(categories);
     res.render('admin/categoryManagement', {
      categories,
      currentPage: page,
      totalPages,
      selectedStatus: req.query.status || '',
      search: search || '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        category.isActive = !category.isActive;
        await category.save();

        res.json({ success: true, message: `Category ${category.isActive ? 'activated' : 'blocked'}`, isActive: category.isActive });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const softDeleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        category.deleted = true;
        category.deletedAt = new Date();
        await category.save();

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
module.exports = {loadCategoryMangement, toggleCategoryStatus, softDeleteCategory};