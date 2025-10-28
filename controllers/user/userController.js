const Product = require('../../models/productSchema');
const loadHomepage =  async (req,res)=>{
    try{
const featuredProducts = await Product.find({isActive: true}).sort({createdAt : -1}).limit(4).lean();

const product = featuredProducts.map((p)=> ({
    _id: p._id,
    name : p.product_name,
    price : p.base_price,
    offerPrice : p.final_price,
    discountPercentage : p.discount_percentage,
    images: p.images
}));

res.render('user/homePage', {products : product});
    }catch(error){
       console.error("Error loading homepage:", error);
    res.status(500).send("Server error");  
    }
};



module.exports = {loadHomepage};