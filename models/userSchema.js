const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        minlength: 8,
        lowercase: true,
        unique: true,
        trim: true,
        validate( value ) {
           if( !validator.isEmail( value )) {
                throw new Error( 'Email is invalid' )
                 }
            }
    },
     gender: {
    type: String,
    enum: ['Male', 'Female'], 
  },
    password: {
        type: String,
        required: false,
        trim: true
    },
    
    phone :{
        type:String,
        required :false,
        unique:false        
    },
    googleId: { 
        type: String,
         default: null 
        },
        isBlocked: {
        type: Boolean,
        default: false,
    },

   
},{timestamps: true});

//to hash
/*userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
*/
const User = mongoose.model('User', userSchema);

module.exports = User;