const mongoose = require("mongoose");
const OrderedItem = require("../../models/orderedItemSchema");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const { increaseStock } = require("../../helpers/stockController");
const { updateOrderStatus } = require("../../helpers/updateOrderStatus");

/* ======================================================
   LOAD ORDER MANAGEMENT (ITEM LEVEL)
====================================================== */
const loadOrderManagementPage = async (req, res) => {
  try {
    const { page = 1, status, search } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;

    /* -------------------------------
       STATUS → BADGE MAP
    -------------------------------- */
const statusClassMap = {
  pending: "pending",
  payment_failed: "payment_failed",
  confirmed: "confirmed",
  shipped: "shipped",
  "in-transit": "in-transit",
  delivered: "delivered",
  cancelled: "cancelled",
  returned: "returned",
 return_requested: "return_requested",

};


      /* =====================================================
       ⭐ NEW: FETCH PAYMENT FAILED ORDERS (ORDER LEVEL)
    ====================================================== */
    let failedOrdersForView = [];

    if (!status || status === "payment_failed") {
      const failedOrders = await Order.find({ paymentStatus: "failed" })
        .populate("user_id")
        .sort({ createdAt: -1 })
        .lean();

      failedOrdersForView = failedOrders.map(order => ({
        _id: order._id,
        customer: order.user_id?.name || "Unknown",
        date: order.createdAt.toLocaleDateString("en-IN"),
        totalPrice: order.totalPrice,
        status: "payment_failed",
        statusClass: "payment_failed"
      }));
    }

    /* -------------------------------
       FETCH ORDERED ITEMS
    -------------------------------- */
    const query = {};
    if (status) query.status = status;

    const items = await OrderedItem.find(query)
      .populate({
        path: "orderId",
        populate: { path: "user_id" }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    /* -------------------------------
       GROUP ITEMS BY ORDER
    -------------------------------- */
    const itemsGroupedByOrder = {};

    items.forEach(item => {
      const orderId = item.orderId?._id?.toString();
      if (!orderId) return;

      if (!itemsGroupedByOrder[orderId]) {
        itemsGroupedByOrder[orderId] = [];
      }
      itemsGroupedByOrder[orderId].push(item);
    });

 /* -------------------------------
       UPDATE STATUS AND BUILD VIEW MODEL
    -------------------------------- */
    const ordersForView = await Promise.all(
      Object.values(itemsGroupedByOrder).map(async orderItems => {
        const orderId = orderItems[0].orderId._id;

        // ✅ Update the status using helper
        const updatedOrder = await updateOrderStatus(orderId);
        const overallStatus = updatedOrder ? updatedOrder.orderStatus : orderItems[0].status;
console.log("Status we got : ", overallStatus);
        return {
          _id: orderId,
          customer: orderItems[0].orderId.user_id?.name || "Unknown",
          date: orderItems[0].orderId.createdAt.toLocaleDateString("en-IN"),
          totalPrice: orderItems.reduce((sum, i) => sum + (i.subtotal || 0), 0),
          status: overallStatus,
          statusClass: statusClassMap[overallStatus] || "unlist"
        };
      })
    );
    /* =====================================================
      MERGE PAYMENT FAILED + NORMAL ORDERS
    ====================================================== */
    const allOrdersForView = [
      ...failedOrdersForView,
      ...ordersForView
    ];


    /* -------------------------------
       TOTAL COUNT (FOR PAGINATION)
    -------------------------------- */
    const totalCount = await OrderedItem.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/orderManagement", {
      orders: allOrdersForView,
      currentPage: Number(page),
      totalPages,
      selectedStatus: status || "",
      search: search || ""
    });

  } catch (err) {
    console.error("LOAD ORDER MANAGEMENT ERROR:", err);
    res.status(500).send("Server error");
  }
};

/* ======================================================
   LOAD SINGLE ORDERED ITEM DETAILS
====================================================== */
const loadOrderedItemDetailsPage = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await OrderedItem.findById(itemId)
      .populate("productId")
      .populate("variantId")
      .populate({
        path: "orderId",
        populate: { path: "shippingAddressId user_id" }
      })
      .lean();

    if (!item) {
      return res.render("admin/orderedItemDetails", {
        error: "Ordered item not found"
      });
    }

    const productName =
      item.productName ||
      item.productId?.name ||
      "Unknown Product";

    const productImage =
      item.image ||
      item.productId?.images?.[0] ||
      "/images/default-product.png";

    const totalAmount =
      (item.finalPrice || item.subtotal || 0) * item.quantity;
    const formattedOrderDate = item.orderId?.createdAt
      ? new Date(item.orderId.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "N/A";
   res.render("admin/orderedItemDetails", {
  item: {
    ...item,
    _id: item._id.toString(),
    productName,
    productImage
  },
  order: {
    ...item.orderId,
    formattedDate: formattedOrderDate   
  },
  address: item.orderId?.shippingAddressId || null,
  totalAmount
});

  } catch (err) {
    console.error("LOAD ITEM DETAILS ERROR:", err);
    res.status(500).send("Server error");
  }
};

/* ======================================================
   UPDATE ORDERED ITEM STATUS (CORE LOGIC)
====================================================== */
const updateOrderedItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status: newStatus, restock } = req.body;

    const VALID_STATUSES = [
      "pending", "payment_failed", "confirmed", "shipped", "in-transit",
      "delivered", "return_requested", "returned", "cancelled"
    ];

    if (!VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const item = await OrderedItem.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const currentStatus = item.status;

    if (currentStatus === "payment_failed") {
      return res.status(400).json({ success: false, message: "Payment failed orders cannot be modified" });
    }

    if (["returned", "cancelled"].includes(currentStatus)) {
      return res.status(400).json({ success: false, message: "Finalized items cannot be modified" });
    }

    if (currentStatus === "delivered" && newStatus !== "return_requested") {
      return res.status(400).json({ success: false, message: "Only return request allowed after delivery" });
    }

    if (newStatus === "returned" && currentStatus !== "return_requested") {
      return res.status(400).json({ success: false, message: "Return must be approved first" });
    }

    // Reject return special case
    if (currentStatus === "return_requested" && newStatus === "delivered") {
      item.status = "delivered";
      await item.save();
      await updateOrderStatus(item.orderId);
      return res.json({ success: true, message: "Return request rejected" });
    }

    if (newStatus === "delivered" && !["shipped", "in-transit"].includes(currentStatus)) {
      return res.status(400).json({ success: false, message: "Item must be shipped before delivery" });
    }

    // ✅ Update item status
    item.status = newStatus;
    if (newStatus === "delivered") item.deliveryDate = new Date();
    if (newStatus === "returned") item.returnCompletedAt = new Date();
    await item.save();

    // Handle refund if returned
    if (newStatus === "returned") {
      const Wallet = require("../../models/walletSchema");
      const WalletTransaction = require("../../models/walletTransactionSchema");
      const order = await Order.findById(item.orderId).lean();

      if (order) {
        let wallet = await Wallet.findOne({ userId: order.user_id });
        if (!wallet) wallet = await Wallet.create({ userId: order.user_id, balance: 0 });

        const orderItems = await OrderedItem.find({ orderId: order._id });

        // Check if all items are now returned
        const allItemsReturned = orderItems.every(
          i => i._id.toString() === item._id.toString() ? newStatus === "returned" : i.status === "returned"
        );

        let refundAmount = 0;
if (allItemsReturned) {
  // 1️⃣ Update order first: zero out deliveryCharge & platformFee
  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    {
      deliveryCharge: 0,
      platformFee: 0
    },
    { new: true } // returns updated document
  );

  // 2️⃣ Calculate refund using only item totals (exclude delivery & platform fee)
  refundAmount = updatedOrder.totalPrice;  // now deliveryCharge is 0

  // 3️⃣ Add refund to wallet
  let wallet = await Wallet.findOne({ userId: updatedOrder.user_id });
  if (!wallet) wallet = await Wallet.create({ userId: updatedOrder.user_id, balance: 0 });

  wallet.balance += refundAmount;
  await wallet.save();

  // 4️⃣ Create wallet transaction
  await WalletTransaction.create({
    userId: updatedOrder.user_id,
    order_id: updatedOrder._id,
    type: "credit",
    title: "refund",
    amount: refundAmount,
    status: "success",
    payment_method: "wallet",
    transactionId: `refund_${Date.now()}_${updatedOrder.user_id}`
  });
}


 else {
          // Item-level proportional refund
          const itemSubtotal = Number(item.subtotal) || 0;
          const totalOriginal = orderItems.reduce((sum, i) => sum + (i.subtotal || 0), 0);
          const totalDiscount = Number(order.couponDiscount || 0);

          refundAmount = itemSubtotal;
          if (totalDiscount > 0 && totalOriginal > 0) {
            const discountShare = totalDiscount * (itemSubtotal / totalOriginal);
            refundAmount -= discountShare;
          }
        }

        refundAmount = Math.max(refundAmount, 0);

        wallet.balance += refundAmount;
        await wallet.save();

        await WalletTransaction.create({
          userId: order.user_id,
          order_id: order._id,
          type: "credit",
          title: "refund",
          amount: refundAmount,
          status: "success",
          payment_method: "wallet",
          transactionId: `refund_${Date.now()}_${order.user_id}`
        });
      }
    }

    // Restock if approved
    if (restock === true || restock === "true") {
      if (item.variantId) {
        await increaseStock(item.variantId, item.quantity);
      } else {
        await Product.findByIdAndUpdate(item.productId, { $inc: { total_stock: item.quantity } });
      }
    }

    // Sync order status
    await updateOrderStatus(item.orderId);

    return res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("UPDATE ITEM STATUS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ======================================================
   EXPORTS
====================================================== */
module.exports = {
  loadOrderManagementPage,
  loadOrderedItemDetailsPage,
  updateOrderedItemStatus
};
