const mongoose = require('mongoose');
const User = require('../models/userSchema');
const Order = require('../models/orderSchema');
const Wallet = require('../models/walletSchema');
const TransactionHistory = require('../models/transactionHistorySchema');
const OrderedItem = require('../models/orderedItemSchema');

mongoose.connect('mongodb://127.0.0.1:27017/kickstyle', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');

  const users = await User.find();

  if (users.length === 0) {
    console.log(' No users found. Please add users first.');
    process.exit(0);
  }

  for (const user of users) {
    console.log(`📦 Seeding data for ${user.name}`);

    // 1️⃣ Wallet
    const wallet = await Wallet.create({
      userId: user._id,
      balance: Math.floor(Math.random() * 500) + 100 // ₹100–₹600
    });

    // 2️⃣ Transaction history (payment for order)
    const transaction = await TransactionHistory.create({
      user_id: user._id,
      title: 'Order Payment',
      amount: 299,
      status: 'success',
      payment_method: 'upi',
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    // 3️⃣ Order
    const order = await Order.create({
      user_id: user._id,
      transactionId: transaction._id,
      shippingAddressId: new mongoose.Types.ObjectId(), // dummy address
      totalPrice: 299,
      orderStatus: 'delivered',
      paymentMethod: 'upi',
      paymentStatus: 'success',
    });

    // 4️⃣ Ordered Item
    await OrderedItem.create({
      orderId: order._id,
      productId: new mongoose.Types.ObjectId(),
      variantId: new mongoose.Types.ObjectId(),
      quantity: 1,
      sku: 'CASUALSNEAKERS-BLU-40',
      productName: 'White Sneakers',
      color: 'Blue',
      size: '40',
      basePrice: 399,
      discount: 25,
      finalPrice: 299,
      subtotal: 299,
      image: 'images/men/sparx_Main.jpeg'
    });

    console.log(`✅ Added order + wallet for ${user.name}`);
  }

  console.log('✨ Seeding complete!');
  process.exit(0);

}).catch(err => {
  console.error(err);
  process.exit(1);
});
