const Order = require("../../models/orderSchema");
const OrderedItem = require("../../models/orderedItemSchema");
const User = require("../../models/userSchema");
const { updateOrderStatus } = require("../../helpers/updateOrderStatus");
const { increaseStock } = require("../../helpers/stockController");
const mongoose = require("mongoose");
const Wallet = require("../../models/walletSchema");
const WalletTransaction = require('../../models/walletTransactionSchema'); 


exports.getAllOrdersById = async (req, res) => {
  try {
    let { page = 1, search = "", status = "" } = req.query;

    page = Number(page);
    const limit = 5;
    const skip = (page - 1) * limit;

    let filter = {};

    // Search by OrderID OR user name
    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: "i" }
      }).select("_id");

      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { user_id: { $in: users.map(u => u._id) } }
      ];
    }

    // 🔧 ADDITION: SUPPORT return_requested FILTER
    if (status === "return_requested") {
      const orderIds = await OrderedItem.distinct("orderId", {
        status: "return_requested"
      });
      filter._id = { $in: orderIds };
    } else if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id");

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

for (let i = 0; i < orders.length; i++) {
  console.log("Before update:", orders[i]._id, orders[i].orderStatus);

  // Call your update function
  await updateOrderStatus(orders[i]._id);

  // Refetch the updated order
  const updatedOrder = await Order.findById(orders[i]._id).populate("user_id", "name");
  console.log("After update:", updatedOrder._id, updatedOrder.orderStatus);

  // Replace in the array
  orders[i] = updatedOrder;
}





    const formattedOrders = [];

    for (const order of orders) {

      // 🔧 ADDITION: CHECK ITEM LEVEL RETURN REQUEST
      const hasReturnRequest = await OrderedItem.exists({
        orderId: order._id,
        status: "return_requested"
      });

      formattedOrders.push({
        _id: order.orderId,
        customer: order.user_id ? order.user_id.name : "Unknown",
        date: order.createdAt.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        totalPrice: order.totalPrice,

        // 🔧 ADDITION: OVERRIDE STATUS DISPLAY ONLY
        status: hasReturnRequest ? "return_requested" : order.orderStatus,
        statusClass: getStatusClass(
          hasReturnRequest ? "return_requested" : order.orderStatus
        )
      });
    }

    res.render("admin/orderManagementMain.hbs", {
      orders: formattedOrders,
      currentPage: page,
      totalPages,
      selectedStatus: status,
      search
    });

  } catch (error) {
    console.error("Error loading orders by ID:", error);
    res.status(500).send("Server Error");
  }
};

exports.getOrderlevelPage = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
      .populate("user_id", "name")
      .populate("shippingAddressId")
      .lean();

    if (!order) return res.status(404).send("Order not found");

  await updateOrderStatus(order._id);

const orderedItems = await OrderedItem.find({ orderId: order._id })
  .populate("productId", "productName image basePrice")
  .lean();


    const itemsForView = orderedItems.map(item => ({
      _id: item._id,
      productName: item.productName || item.productId?.productName || "Unknown",
      quantity: item.quantity,
      price: item.subtotal || item.finalPrice || item.basePrice || 0,
      productImage: item.image || item.productId?.image || "",
      status: item.status,
      statusClass: getStatusClass(item.status),
      status: item.status
    }));
const fullOrderReturnRequested =
  orderedItems.length > 0 &&
  orderedItems.every(item => item.status === "return_requested");

    res.render("admin/orderManagement", {
      order: {
        _id: order.orderId,
        customerName: order.user_id?.name || "Unknown",
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
 orderStatus: order.orderStatus,         deliveryDate: order.deliveryDate,
        shippingAddress: order.shippingAddressId
      },
      orderedItems: itemsForView,
      fullOrderReturnRequested
    });

  } catch (err) {
    console.error("Error fetching order details:", err);
    res.status(500).send("Server Error");
  }
};

//---------ENTIRE ORDER RETURN HANDLING---------
exports.handleFullOrderReturn = async (req, res) => {
  try {
    const { orderId } = req.params;  
    const { action, restock } = req.body;

    console.log("REQ BODY:", req.body);
    console.log("REQ PARAMS:", req.params);

    const realOrder = await Order.findOne({ orderId });

    if (!realOrder) {
      return res.status(404).json({ success: false, message: "Order not found!" });
    }

    const items = await OrderedItem.find({
      orderId: realOrder._id.toString(),
      status: "return_requested"
    });

    if (!items.length) {
      return res.status(400).json({ success: false, message: "No items pending return!" });
    }

    //  MUST BE HERE SO EVERYONE CAN SEE IT
    let refundAmount = 0;

    // ================== APPROVE RETURN ==================
    if (action === "approve") {
      for (const item of items) {
        item.status = "returned";
        await item.save();

refundAmount = realOrder.totalPrice;

        if (restock && item.variantId) {
          await increaseStock(item.variantId, item.quantity);
        }
      }

      realOrder.orderStatus = "returned";
      realOrder.paymentStatus = "refunded";
      realOrder.deliveryCharge = 0;
      realOrder.platformFee = 0;
      realOrder.couponDiscount = 0;
      await realOrder.save();


      // ---------- WALLET CREDIT ----------
      let wallet = await Wallet.findOne({ userId: realOrder.user_id });

      if (!wallet) {
        wallet = await Wallet.create({
          userId: realOrder.user_id,
          balance: refundAmount
        });
      } else {
        wallet.balance += refundAmount;
        await wallet.save();
      }
      
      // --------- WALLET TRANSACTION LOG ----------
      await WalletTransaction.create({
        userId: realOrder.user_id,
        type: "credit",
        title: "refund",
        amount: refundAmount,
        status: "success",
        payment_method: "wallet",
        order_id: realOrder._id,
        transactionId: `REF-${Date.now()}-${Math.floor(Math.random() * 9999)}`
      });

      return res.json({ 
        success: true, 
        message: `Full order return approved & ₹${refundAmount} refunded` 
      });
    }

    // ================== DECLINE RETURN ==================
    if (action === "decline") {
      for (const item of items) {
        item.status = "delivered";
        await item.save();
      }
realOrder.returnDeclined = true;
  await realOrder.save();
      return res.json({ success: true, message: "Full order return declined" });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });

  } catch (err) {
    console.error("Full order return error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



// ------------------------------------
//  ADDITIVE CHANGE ONLY (NO REMOVAL)
// ------------------------------------
function getStatusClass(status) {
  switch (status) {
    case "pending": return "pending";
    case "confirmed": return "confirmed";
    case "shipped": return "shipped";
    case "in-transit": return "in-transit";
    case "delivered": return "delivered";
    case "return_requested": return "warning"; 
    case "returned": return "returned";
    case "cancelled": return "cancelled";
    default: return "";
  }
}
