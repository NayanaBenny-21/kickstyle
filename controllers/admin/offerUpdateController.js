const Offer = require('../../models/offerSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');

const loadAddOffer = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).lean();
    const categories = await Category.find({ isActive: true }).lean();
    console.log("categoriesS:", categories);
    res.render('admin/addOffer', {
      products,
      categories
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/error');
  }
};

const addOffer = async (req, res) => {
  try {
    const { offerName, offerType, discountType, discountValue, products, category, startDate, endDate } = req.body;

    // Basic validations
    if (!offerName || !offerType || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).send("All fields are required");
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).send("End date must be after start date");
    }

    // Validate products if it's a product offer
    let productIds = [];
    if (offerType === "product") {
      if (!products || !products.length) return res.status(400).send("Select at least one product");

      // Fetch product final prices
      const productDocs = await Product.find({ _id: { $in: products } });
      productIds = productDocs.map(p => p._id);

      if (discountType === "flat") {
        const minPrice = Math.min(...productDocs.map(p => p.finalPrice));
        if (Number(discountValue) > minPrice) {
          return res.status(400).send(`Flat discount cannot exceed ₹${minPrice}`);
        }
      } else if (discountType === "percentage") {
        if (Number(discountValue) > 100) {
          return res.status(400).send("Percentage discount cannot exceed 100%");
        }
      }
    }

    // Validate category if it's a category offer
    if (offerType === "category") {
      if (!category) return res.status(400).send("Select a category");

      // Optional: Validate if category exists
      const cat = await Category.findById(category);
      if (!cat) return res.status(400).send("Category not found");
    }

    // Create offer
    const newOffer = new Offer({
      offerName,
      offerType,
      discountType,
      discountValue,
      products: productIds,
      category: category || null,
      startDate,
      endDate
    });

    await newOffer.save();
    return res.redirect('/admin/offer-management');
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
};


const loadEditOfferPage = async (req, res) => {
  try {
    const offerId = req.params.offerId;

    const offerDoc = await Offer.findById(offerId).lean();
    if (!offerDoc) {
      return res.status(404).send("Offer not found");
    }

    const productIds = (offerDoc.products || []).map(id => id.toString());

    const categoryId = offerDoc.category
      ? offerDoc.category.toString()
      : '';

    const formatDate = (date) =>
      date ? new Date(date).toISOString().slice(0, 10) : '';

    const offer = {
      ...offerDoc,
      products: productIds,
      category: categoryId,
      startDateFormatted: formatDate(offerDoc.startDate),
      endDateFormatted: formatDate(offerDoc.endDate),
    };

    const products = await Product.find().lean();
    const categories = await Category.find().lean();

    res.render('admin/editOffer', {
      offer,
      products,
      categories
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
};

// POST: Edit Offer
const editOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;

    const {
      offerName,
      offerType,
      discountType,
      discountValue,
      startDate,
      endDate,
      category
    } = req.body;

    const isActive = req.body.isActive === "true";

    const errors = {};

    /* -------- VALIDATION -------- */

    if (!offerName || !offerName.trim()) {
      errors.offerName = "Offer name is required";
    }

    if (!offerType) {
      errors.offerType = "Offer type is required";
    }

    if (!discountType) {
      errors.discountType = "Discount type is required";
    }

    if (!discountValue || Number(discountValue) <= 0) {
      errors.discountValue = "Enter a valid discount value";
    }

    if (
      discountType === "percentage" &&
      Number(discountValue) > 100
    ) {
      errors.discountValue = "Percentage cannot exceed 100";
    }

    if (!startDate || !endDate) {
      errors.global = "Start and end date are required";
    } else if (new Date(startDate) >= new Date(endDate)) {
      errors.global = "End date must be after start date";
    }

    let products = [];
    let categoryId = null;

    if (offerType === "product") {
      products = Array.isArray(req.body.products)
        ? req.body.products
        : req.body.products
        ? [req.body.products]
        : [];

      if (!products.length) {
        errors.products = "Select at least one product";
      }
    }

    if (offerType === "category") {
      if (!category) {
        errors.category = "Select a category";
      } else {
        categoryId = category;
      }
    }

    /* -------- IF ERRORS → RENDER PAGE AGAIN -------- */

    if (Object.keys(errors).length > 0) {
      const productsList = await Product.find().lean();
      const categoriesList = await Category.find().lean();

      return res.render("admin/editOffer", {
        offer: {
          _id: offerId,
          offerName,
          offerType,
          discountType,
          discountValue,
          products,
          category: categoryId,
          startDateFormatted: startDate,
          endDateFormatted: endDate,
          isActive
        },
        products: productsList,
        categories: categoriesList,
        errors
      });
    }

    /* -------- UPDATE DB -------- */

    await Offer.findByIdAndUpdate(offerId, {
      offerName: offerName.trim(),
      offerType,
      discountType,
      discountValue: Number(discountValue),
      products,
      category: categoryId,
      startDate,
      endDate,
      isActive
    });

    res.redirect("/admin/offer-management");

  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed");
  }
};




module.exports = { loadAddOffer, addOffer, loadEditOfferPage, editOffer };