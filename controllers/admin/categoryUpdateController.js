const mongoose = require('mongoose');
const Category = require('../../models/categorySchema');
const {processCategoryImage} = require ('../../middlewares/categoryImageMiddleware')
const { deleteImage } = require('../../helpers/fileHelper');

const loadAddCategory = async (req, res) => {
    try {
        res.render('admin/addCategory');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

const addCategory = async (req,res) => {
    try {
        const { category, description, isActive } = req.body;
        const thumbnail = req.body.thumbnail;
      const newCategory = new Category({
      category,
      description,
      thumbnail,
      isActive: isActive === 'true' 
      });
      await newCategory.save();
      res.redirect('admin/category-management')
    } catch (error) {
            console.error(err);
    res.status(500).send('Server Error');
    }
}


const loadEditCategory = async (req, res) => {
   try {
    const categoryId = req.params.categoryId;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).send('Invalid category ID');
    }

    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).send('Category not found');
    }

    res.render('admin/editCategory', { category });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}; 



const editCategory = async (req, res) => {
    try {
            const categoryId = req.params.categoryId;
            if (!mongoose.Types.ObjectId.isValid(categoryId)) return res.status(400).send("Invalid category ID");
         const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) return res.status(404).send("Category not found");

             const { category, description, isActive } = req.body;
       const updateData = {
      category,
      description,
      isActive: isActive === 'true' 
    } 
      if (req.body.thumbnail) {
     if (existingCategory.thumbnail) {
        deleteImage(existingCategory.thumbnail);
      }
      updateData.thumbnail = req.body.thumbnail;
    }
      const updatedCategory = await Category.findByIdAndUpdate(categoryId,updateData );
        if (!updatedCategory) {
      return res.status(404).send('Category not found');
    } 
    res.redirect('/admin/category-management'); 
    }catch (error) {
        console.error(error);
    res.status(500).send('Server Error');
    }
}
module.exports = {loadAddCategory, addCategory, loadEditCategory, editCategory};