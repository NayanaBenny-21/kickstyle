const mongoose = require('mongoose');
const Category = require('../../models/categorySchema');
const { processCategoryImage } = require('../../middlewares/categoryImageMiddleware')
const { deleteImage } = require('../../helpers/fileHelper');
const fs = require("fs");
const path = require("path");


function formatCategoryName(name) {
  name = name.trim().toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const loadAddCategory = async (req, res) => {
  try {
    res.render('admin/addCategory');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

const addCategory = async (req, res) => {
  try {

    const { category, description, isActive, thumbnail } = req.body;

    const trimmedCategory = category.trim();
    const formattedCategory = formatCategoryName(category);

    // Duplicate check (case-insensitive)
    const existingCategory = await Category.findOne({
      category: { $regex: `^${formattedCategory}$`, $options: "i" }
    });

    if (existingCategory) {
      return res.json({
        success: false,
        message: "Category already exists"
      });
    }

    // Validate cropped image
    if (!thumbnail) {
      return res.json({
        success: false,
        message: "Please crop and upload category image"
      });
    }

    // Convert base64 to image
    const base64Data = thumbnail.replace(/^data:image\/\w+;base64,/, "");

    const fileName = `category-${Date.now()}.jpg`;
    const filePath = path.join(__dirname, "../../public/images/category", fileName);

    fs.writeFileSync(filePath, base64Data, "base64");

    const newCategory = new Category({
      category: formattedCategory,
      description,
      thumbnail: fileName,
      isActive: isActive === "true"
    });

    await newCategory.save();

    return res.json({
      success: true,
      redirect: "/admin/category-management"
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


const loadEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).send('Invalid category ID');
    }

    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.redirect("/admin/category-management?error=notfound");
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

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).send("Invalid category ID");
    }

    const existingCategory = await Category.findById(categoryId);

    if (!existingCategory) {
      return res.redirect("/admin/category-management?error=notfound");
    }

    const { category, description, isActive, thumbnail } = req.body;

    const updateData = {
      category: formatCategoryName(category),
      description,
      isActive: isActive === "true"
    };

    // If new cropped image is provided
    if (thumbnail && thumbnail.startsWith("data:image")) {

      const base64Data = thumbnail.replace(/^data:image\/\w+;base64,/, "");

      const fileName = `category-${Date.now()}.jpg`;

      const filePath = path.join(
        __dirname,
        "../../public/images/category",
        fileName
      );

      fs.writeFileSync(filePath, base64Data, "base64");

      // delete old image
      if (existingCategory.thumbnail) {
        deleteImage(existingCategory.thumbnail);
      }

      updateData.thumbnail = fileName;
    }

    await Category.findByIdAndUpdate(categoryId, updateData);

    res.redirect("/admin/category-management");

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
module.exports = { loadAddCategory, addCategory, loadEditCategory, editCategory };