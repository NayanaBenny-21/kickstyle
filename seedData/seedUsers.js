

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/userSchema");
const Wallet = require("../models/walletSchema");
const WalletTransaction = require("../models/walletTransactionSchema");

async function seedUsers() {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await WalletTransaction.deleteMany({});

    const usersData = [
        { name: 'Alice', email: 'alice@example.com', gender: 'Female', isBlocked: false, password: 'password123' },
        { name: 'Bob', email: 'bob@example.com', gender: 'Male', isBlocked: true, password: 'password123' },
        { name: 'Charlie', email: 'charlie@example.com', gender: 'Male', isBlocked: false, password: 'password123' },
        { name: 'David', email: 'david@example.com', gender: 'Male', isBlocked: true, password: 'password123' },
        { name: 'Eve', email: 'eve@example.com', gender: 'Female', isBlocked: false, password: 'password123' }
    ];

    for (let user of usersData) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }

    const users = await User.insertMany(usersData);
    console.log("Users inserted:", users.length);
    mongoose.connection.close();
}

// Connect to DB first, then seed
connectDB().then(() => seedUsers());

