const Order = require("../../models/orderSchema");
const OrderedItem = require("../../models/orderedItemSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");

// ================= DASHBOARD =================
exports.loadDashboard = async (req, res) => {
  try {
    const filter = req.query.filter || "monthly"; // daily | monthly | yearly

    // -------- SUMMARY COUNTS --------
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // -------- BEST SELLING PRODUCTS --------
    const bestProducts = await OrderedItem.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: "$productId",
          totalSold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.product_name",
          totalSold: 1
        }
      }
    ]);

    // -------- BEST SELLING CATEGORIES --------
    const bestCategories = await OrderedItem.aggregate([
      { $match: { status: "delivered" } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category_id",
          totalSold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $project: {
          name: "$category.category",
          totalSold: 1
        }
      }
    ]);

    // -------- BEST SELLING BRANDS --------
    const bestBrands = await OrderedItem.aggregate([
      { $match: { status: "delivered" } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.brand",
          totalSold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      { $project: { name: "$_id", totalSold: 1 } }
    ]);

    // -------- SALES CHART --------
    let labels = [];
    let data = [];

    const now = new Date();

    // ===== DAILY (current month, all days) =====
    if (filter === "daily") {
      const year = now.getFullYear();
      const month = now.getMonth();

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dailyAgg = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
            createdAt: { $gte: start, $lt: end }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            total: { $sum: "$totalPrice" }
          }
        }
      ]);

      const dailyMap = {};
      dailyAgg.forEach(i => dailyMap[i._id] = i.total);

      labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
      data = labels.map(day => dailyMap[day] || 0);
    }

    // ===== MONTHLY (current year, Jan–Dec) =====
    else if (filter === "monthly") {
      const year = now.getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);

      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      const monthlyAgg = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
            createdAt: { $gte: start, $lt: end }
          }
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: "$totalPrice" }
          }
        }
      ]);

      const monthMap = {};
      monthlyAgg.forEach(i => monthMap[i._id] = i.total);

      labels = months;
      data = months.map((_, idx) => monthMap[idx + 1] || 0);
    }

    // ===== YEARLY =====
    else {
      const yearlyAgg = await Order.aggregate([
        { $match: { orderStatus: "delivered" } },
        {
          $group: {
            _id: { $year: "$createdAt" },
            total: { $sum: "$totalPrice" }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      labels = yearlyAgg.map(i => String(i._id));
      data = yearlyAgg.map(i => i.total);
    }

    // -------- RENDER --------
    res.render("admin/dashboard", {
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      bestProducts,
      bestCategories,
      bestBrands,
      chartLabels: JSON.stringify(labels),
      chartData: JSON.stringify(data),
      filter
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).send("Server Error");
  }
};

// ================= LEDGER PAGE =================
exports.loadLedger = async (req, res) => {
  try {
    // Get all orders sorted oldest → newest (important for running balance)
    const orders = await Order.find().sort({ createdAt: 1 }).lean();

    let balance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    const ledger = orders.map(o => {
      let credit = 0;
      let debit = 0;
      let description = "Order Placed";

      // CREDIT (Revenue)
      if (o.orderStatus === "delivered") {
        credit = o.totalPrice || 0;
        description = "Order Delivered";
        balance += credit;
        totalCredit += credit;
      }

      // DEBIT (Refund / Cancel / Return)
      if (["cancelled", "returned"].includes(o.orderStatus)) {
        debit = o.totalPrice || 0;
        description = "Order Refunded";
        balance -= debit;
        totalDebit += debit;
      }

      return {
        date: new Date(o.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        reference: o._id.toString().slice(-6).toUpperCase(),
        description,
        credit: credit ? credit.toFixed(2) : "",
        debit: debit ? debit.toFixed(2) : "",
        balance: balance.toFixed(2)
      };
    });

    res.render("admin/ledger", {
      ledger,
      totalCredit: totalCredit.toFixed(2),
      totalDebit: totalDebit.toFixed(2),
      netBalance: balance.toFixed(2)
    });

  } catch (err) {
    console.error("Ledger Error:", err);
    res.redirect("/admin/dashboard");
  }
};

