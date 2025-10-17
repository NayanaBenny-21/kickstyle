const mongoose =  require('mongoose');
const connectDB = require("../config/db");
const category = require('../models/categorySchema');

async function seedCategory() {
    
    await category.insertMany([
        {
            category : 'men',
            description: 'All footwear for men including sneakers, sandals, and formal shoes',
            thumbnail : 'category/men.png'
        },{
            category: 'women',
            description: 'Women footwear collection with heels, flats, and sneakers',
            thumbnail : 'category/women.png'
        },{
            category: 'kids',
            description: 'Kids footwear including school shoes, sandals, and sneakers',
            thumbnail: 'category/kids.png'
        },{
            category : 'sports',
            description : 'Sports footwear including running shoes and training shoes',
            thumbnail: 'category/sports.png'
        }
    ]);
     mongoose.connection.close();
}


connectDB().then(()=> seedCategory())