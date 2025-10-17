const express = require('express');
const router = express.Router();
const Product = require('../models/productSchema');

router.get('/', async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.redirect('/');
   try {
const products = await Product.find({
  $or: [
    { 
      product_name: { $regex: query, $options: 'i' } },
    { brand: { $regex: query, $options: 'i' } }
  ]
}).lean();

    res.render('user/searchResults', { products, query });
      } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;