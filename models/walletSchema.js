const mongoose = require('mongoose'); // make sure 'mongoose' is spelled correctly
const Schema = mongoose.Schema;       // now Schema is defined

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
