const Wallet = require("../../models/walletSchema");
const WalletTransaction = require('../../models/walletTransactionSchema'); 
const Order = require("../../models/orderSchema");
const Cart = require("../../models/cartSchema");


exports.loadWalletPage = async (req, res) => {
  try {
const userId = req.user ? req.user._id : req.session.userId;
    if (!userId) {

      return res.redirect("/auth/login");
    }
    let wallet = await Wallet.findOne({ userId }).lean();

    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0 });
      wallet = wallet.toObject(); // 👈 convert after create
    }
   let transactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Format the date as dd/mm/yyyy
 transactions = transactions.map(tx => ({
  ...tx,
  formattedDate: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB') : ''
}));

    res.render("user/wallet", {
      wallet,
      transactions
    });

  } catch (err) {
    console.error("Wallet load failed:", err);
    res.render("user/wallet", {
      wallet: { balance: 0 },
      transactions: []
    });
  }
};
exports.payUsingWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddressId, amount, couponId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // 1️⃣ Deduct wallet (atomic)
    const wallet = await Wallet.findOneAndUpdate(
      { userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!wallet) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // 2️⃣ Create order
    const generateOrderId = () =>
      "ORD-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const order = await Order.create({
      orderId: generateOrderId(),
      user_id: userId,
      shippingAddressId,
      totalPrice: amount,           
      paymentMethod: "wallet",      
      paymentStatus: "completed",
      orderStatus: "Placed",
      transactionId: "WALLET-" + Date.now(),
      couponApplied: couponId || null
    });

    // 3️⃣ Wallet transaction
    await WalletTransaction.create({
      userId,
      type: "debit",
      title: "Order Payment",
      amount,
      status: "success",
      payment_method: "wallet",
      order_id: order._id,
      transactionId: `wallet_${Date.now()}_${userId}`
    });

    return res.json({ success: true, orderId: order._id });

  } catch (err) {
    console.error("Wallet payment failed:", err);
    return res.status(500).json({
      success: false,
      message: "Wallet payment failed"
    });
  }
};
