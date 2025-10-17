const category = require('../models/categorySchema');
const product = require('../models/productSchema');
const Variant = require('../models/variantSchema');
const connectDB = require('../config/db');


async function seedProduct() {
    const menCategory =await category.findOne({category: 'men'});
    if(!menCategory){
        throw new Error ('category not found');
    }
  const insertedProducts =  await product.insertMany([
          {
      product_name: 'Mens Casual shoe',
      brand: 'Nike',
      category_id: menCategory._id,
      description: 'Lightweight casual shoe with sweat free',
      images: { main: 'men/BrownCasual_main.jpeg', gallery: ['men/Brown_casual1.jpeg'] },
      base_price: 2000,
      final_price: 1800,
      discount_percentage: 10,
      total_stock: 0,
      isActive: true
    },
    {
      product_name: 'Formal Leather Shoes',
      brand: 'Clarks',
      category_id: menCategory._id,
      description: 'Elegant leather shoes for men',
      images: { main: 'men/formalLeather_main.png', gallery: ['men/formalLeather.png'] },
      base_price: 2500,
      final_price: 2250,
      discount_percentage: 10,
      total_stock: 0,
      isActive: true
    },
    {
    product_name: 'Casual Loafers',
    brand: 'Bata',
    category_id: menCategory._id,
    description: 'Comfortable loafers for casual outings',
    images: {
      main: '/men/loafers-main.jpg',
      gallery: ['men/casualLoafers_main.jpeg', 'men/casualLoafers.jpeg']
    },
    base_price: 1500,
    final_price: 1350,
    discount_percentage: 10,
    total_stock: 0,
    isActive: true
  },
  {
    product_name: 'Sports Running Shoes',
    brand: 'Adidas',
    category_id: menCategory._id,
    description: 'Durable sports shoes for running and training',
    images: {
      main: 'products/men/sports-main.jpg',
      gallery: ['men/adidasRunningShoe_main.jpeg', 'men/adidasRunningShoe.jpeg']
    },
    base_price: 3000,
    final_price: 2700,
    discount_percentage: 10,
    total_stock: 0,
    isActive: true
  },
  {
    product_name: 'Sandals & Flip-Flops',
    brand: 'Puma',
    category_id: menCategory._id,
    description: 'Comfortable sandals for casual wear and beach',
    images: {
      main: 'men/pumaFlipflops_main.jpeg',
      gallery: ['men/pumaFlipflops.jpeg']
    },
    base_price: 800,
    final_price: 720,
    discount_percentage: 10,
    total_stock: 0,
    isActive: true
  },
    {
    product_name: 'Trail Running Shoes',
    brand: 'Puma',
    category_id: menCategory._id,
    description: 'Rugged shoes designed for outdoor trail running',
    images: { main: 'men/casualwhiteShoe_main.jpeg', gallery: ['men/casualwhiteShoe.jpeg'] },
    base_price: 2800,
    final_price: 2500,
    discount_percentage: 11,
    total_stock: 0,
    isActive: true
  },
  {
    product_name: 'Casual Sneakers',
    brand: 'Sparx',
    category_id: menCategory._id,
    description: 'Stylish sneakers for everyday casual wear',
    images: { main: 'products/men/casual-main.jpg', gallery: ['products/men/casual1.jpg','products/men/casual2.jpg'] },
    base_price: 1200,
    final_price: 1100,
    discount_percentage: 8,
    total_stock: 0,
    isActive: true
  },
  {
    product_name: 'Stylish Leather Look Casual Shoe',
    brand: 'Bata',
    category_id: menCategory._id,
    description: 'Soft Cushioned|Comfortable Sneakers For Men',
    images: { main: 'men/casualBrown_main.jpeg', gallery: ['men/casualBrown.jpeg'] },
    base_price: 2200,
    final_price: 2000,
    discount_percentage: 9,
    total_stock: 0,
    isActive: true
  },
  {
    product_name: 'Running Shoes Limited Edition',
    brand: 'Nike',
    category_id: menCategory._id,
    description: 'Limited edition running shoes for men',
    images: { main: 'men/NikeLimitedEdition_main.jpg', gallery: ['men/NikeLimitedEdition.jpg'] },
    base_price: 3500,
    final_price: 3150,
    discount_percentage: 10,
    total_stock: 0,
    isActive: true
  },
  {
    product_name: 'Leather Formal Boots',
    brand: 'Red Tape',
    category_id: menCategory._id,
    description: 'Premium leather boots for formal and winter wear',
    images: { main: 'men/leatherBoots_main.jpeg', gallery: ['men/leatherBoots.jpeg'] },
    base_price: 4000,
    final_price: 3600,
    discount_percentage: 10,
    total_stock: 0,
    isActive: true
  }
    ]);
    console.log("Products Inserted");
    return insertedProducts;
}

async function seedVariants(products) {

    for (let product of products){
      await Variant.insertMany([
        {
        product_id: product._id,
        sku: `${product.product_name.replace(/\s+/g,'').toUpperCase()}-BLK-42`,
        color: 'Black',
        size: '42',
        stock: Math.floor(Math.random() * 10) + 5,
        image: product.images.main,
        isActive: true
      },
      {
        product_id: product._id,
        sku: `${product.product_name.replace(/\s+/g,'').toUpperCase()}-BLK-43`,
        color: 'Black',
        size: '43',
        stock: Math.floor(Math.random() * 10) + 5,
        image: product.images.main,
        isActive: true
      },
      {
        product_id: product._id,
        sku: `${product.product_name.replace(/\s+/g,'').toUpperCase()}-BLK-40`,
        color: 'Black',
        size: '40',
        stock: Math.floor(Math.random() * 10) + 5,
        image: product.images.main,
        isActive: true
      }
       ]);

    }
}
connectDB().then(async () => {
  const products = await seedProduct();
  await seedVariants(products);
  process.exit(0);
});