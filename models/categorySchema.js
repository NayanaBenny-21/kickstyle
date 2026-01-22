const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category : { type: String, required: true, unique: true},
    description : { type: String, required :true},
    thumbnail : { type: String, required: true},
    isActive : { type: Boolean, default: true},
     deleted: { type: Boolean, default: false },
     deletedAt: { type: Date, default: null }
}, {timestamps: true});

module.exports = mongoose.model('Category', categorySchema);
