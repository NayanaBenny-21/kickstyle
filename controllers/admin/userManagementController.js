const mongoose = require('mongoose');

const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const Wallet = require('../../models/walletSchema');
const loadUserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    const skip = (page - 1) * limit;

    // Aggregate users with orders and wallet info
    const userData = await User.aggregate([
      { $sort: { createdAt: -1 } }, 
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user_id",
          as: "orders"
        }
      },
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "userId",
          as: "wallet"
        }
      },
      {
        $addFields: {
          ordersCount: { $size: "$orders" },
          balance: { $ifNull: [{ $arrayElemAt: ["$wallet.balance", 0] }, 0] },
          status: { $cond: ["$isBlocked", "Blocked", "Active"] },
          statusClass: { $cond: ["$isBlocked", "bg-danger", "bg-success"] },
          isActive: { $cond: ["$isBlocked", false, true] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          orders: "$ordersCount",
          balance: { $round: ["$balance", 2] },
          status: 1,
          statusClass: 1,
          isActive: 1
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/user_management", {
      users: userData,
      currentPage: page,
      totalPages
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const blockToggleUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    console.log("User data :", user);
    if(!user) {
 return res.status(404).json({ success: false, message: 'User not found' });
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({
    success : true,
    message : user.isBlocked ? 'Blocked the user' : 'Unblocked the user',
    isBlocked: user.isBlocked
  })
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
module.exports = { loadUserManagement, blockToggleUser };
