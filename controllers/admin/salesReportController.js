const Order = require("../../models/orderSchema");
const WalletTransaction = require("../../models/walletTransactionSchema");
const { updateOrderStatus } = require('../../helpers/updateOrderStatus');

// ---------------- HELPER ----------------
const round2 = (num) => Math.round((num || 0) * 100) / 100;

// ---------------- DATE FILTER ----------------
const buildDateFilter = (query) => {
  let fromDate, toDate;
  const now = new Date();

  switch (query.range) {
    case "daily":
      fromDate = new Date(now.setHours(0, 0, 0, 0));
      toDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "weekly":
      toDate = new Date();
      fromDate = new Date();
      fromDate.setDate(toDate.getDate() - 7);
      break;
    case "monthly":
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "yearly":
      fromDate = new Date(now.getFullYear(), 0, 1);
      toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      if (query.startDate && query.endDate) {
        fromDate = new Date(query.startDate);
        toDate = new Date(query.endDate);
        toDate.setHours(23, 59, 59, 999);
      }
  }

  return fromDate && toDate ? { orderDate: { $gte: fromDate, $lte: toDate } } : {};
};

const enrichOrdersWithRevenue = async (orders) => {
  // Get all order IDs
  const orderIds = orders.map(o => o._id);

  // Fetch wallet refund transactions for these orders
  const walletRefunds = await WalletTransaction.find({
    order_id: { $in: orderIds },
    type: "credit",
    title: "refund",
    status: "success"
  }).lean();

  return await Promise.all(
    orders.map(async (o) => { // ← async here too
      const delivery = o.deliveryCharge || 0;
      const platformFee = o.platformFee || 0;
      const discount = o.couponDiscount || 0;

      const sales = round2(o.totalPrice || 0);

      const refund = round2(
        walletRefunds
          .filter(tx => tx.order_id.toString() === o._id.toString())
          .reduce((sum, tx) => sum + (tx.amount || 0), 0)
      );

      const netAmount = round2(sales - refund);
      const deliveredItems = (o.items || []).filter(item => item.status === "delivered").length;

      // Compute dynamic order status
      const updatedOrder = await updateOrderStatus(o._id);
      const dynamicStatus = updatedOrder ? updatedOrder.orderStatus : o.orderStatus;

      return {
        ...o,
        deliveryCharge: delivery,
        platformFee,
        sales,
        refund,
        netAmount,
        deliveredItems,
        orderStatus: dynamicStatus, 
      };
    })
  ); 
};

// ---------------- SUMMARY CALCULATION ----------------
// ---------------- SUMMARY CALCULATION ----------------
const calculateSalesSummary = (orders) => {
  return {
    count: orders.length,
    sales: round2(orders.reduce((s, o) => s + (o.sales || 0), 0)),
    delivery: round2(orders.reduce((s, o) => s + (o.deliveryCharge || 0), 0)),
    platformFee: round2(orders.reduce((s, o) => s + (o.platformFee || 0), 0)),
    discount: round2(orders.reduce((s, o) => s + (o.couponDiscount || 0), 0)),
    refunds: round2(orders.reduce((s, o) => s + (o.refund || 0), 0)),
    net: round2(orders.reduce((s, o) => s + (o.netAmount || 0), 0)),
     deliveredCount: orders.reduce((sum, o) => sum + (o.deliveredItems || 0), 0) 
  };
};



// ---------------- GET SALES REPORT ----------------
exports.getSalesReport = async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query);

    let orders = await Order.find({ ...dateFilter })
      .populate("user_id", "name")
      .sort({ orderDate: -1 })
      .lean();

orders = await enrichOrdersWithRevenue(orders);

  const summary = calculateSalesSummary(orders);
    // Return JSON for AJAX
    if (req.xhr || req.headers.accept.includes("application/json")) {
      return res.json({ orders, summary });
    }

    // Render page
    res.render("admin/sales-report", {
      orders,
      summary,
      filters: req.query,
    });
  } catch (err) {
    console.error("Sales report error:", err);
    res.status(500).send("Sales report error");
  }
};

// ---------------- EXPORT FOR PDF/EXCEL ----------------
exports.getReportData = async (req) => {
  const dateFilter = buildDateFilter(req.query);

  let orders = await Order.find({ ...dateFilter })
    .populate("user_id", "name")
    .sort({ orderDate: -1 })
    .lean();

  orders = await enrichOrdersWithRevenue(orders);

  const summary = calculateSalesSummary(orders);

  return { orders, summary };
};
