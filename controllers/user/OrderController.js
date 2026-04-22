const Order = require('../../models/orderSchema');
const OrderedItem = require('../../models/orderedItemSchema');
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const { increaseStock } = require('../../helpers/stockController');
const { formatLocalDate } = require('../../helpers/dateFormatter');
const Wallet = require("../../models/walletSchema");
const WalletTransaction = require('../../models/walletTransactionSchema'); 
const Coupon = require("../../models/couponSchema");
const CouponUsage = require("../../models/couponUsageSchema");

const buyNow = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { productId, variantId, quantity } = req.body;
    if (!productId || !variantId || !quantity) return res.json({ success: false, message: "Invalid data" });

    const variant = await Variant.findById(variantId);
    if (!variant) return res.json({ success: false, message: "Variant not found" });
    if (variant.stock < quantity) return res.json({ success: false, message: "Not enough stock" });

    req.session.buyNow = { productId, variantId, quantity: Number(quantity) };

    return res.json({ success: true });
  } catch (err) {
    console.error("Buy Now Error:", err);
    return res.json({ success: false, message: "Server error" });
  }
};

const loadOrdersPage = async (req, res) => {
  try {
        const userId = req.user ? req.user.id : req.session.userId; 
    //    console.log("User id getting : ", userId);
        
    if (!userId) {
      return res.redirect('/auth/login');
    }
   
    let orders = await Order.find({user_id : userId }).sort({ createdAt: -1 }).lean();

const { formatLocalDate } = require('../../helpers/dateFormatter');

orders = orders.map(order => {
  // expectedDeliveryDate
  if (!order.expectedDeliveryDate) {
    const expected = new Date(order.createdAt);
    expected.setDate(expected.getDate() + 10);
    order.expectedDeliveryDate = formatLocalDate(expected);
  } else {
    order.expectedDeliveryDate = formatLocalDate(order.expectedDeliveryDate);
  }

  // deliveryDate
  if (order.deliveryDate) {
    order.deliveryDate = formatLocalDate(order.deliveryDate);
  }

  return order;
});


 
    const ordersWithItems = await Promise.all(
  orders.map(async (order) => {
    const items = await OrderedItem.find({ orderId: order._id }).lean();
    const hasFailedPayment = items.some(item => item.status === "payment_failed");
    // Entire order is cancellable only if ALL items are cancellable
    const allItemsCancellable = items.every(item =>
      !["cancelled", "delivered", "returned", "return_requested"].includes(item.status)
    );
const allItemsDelivered = items.every(
  item => item.status === "delivered"
);
    items.forEach(item => {
      item.canReturnItem = item.status === "delivered";
    });
    return { 
      ...order, 
      items,
      canCancelOrder: order.orderStatus !== "delivered" &&
                      order.orderStatus !== "cancelled" &&
                      order.orderStatus !== "payment_failed" &&
                      allItemsCancellable,
                       canReturnOrder: allItemsDelivered&& !order.returnDeclined,  
      hasFailedPayment
    };
  })
);


    //console.log('Orders with items:', ordersWithItems); 
       res.render('user/orders', { user: req.session.user, orders: ordersWithItems  });

  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};


const loadOrderSuccessPage = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).render("error", { message: "Order not found" });
    }

    res.render("user/orderSuccessfulPage", {
      orderId: order._id.toString(),
      paymentMethod: order.paymentMethod,
      title: "Order Successful - Kickstyle",
    });
  } catch (error) {
    console.error("Error loading success page:", error);
    res.status(500).render("error", { message: "Something went wrong" });
  }
};

const cancelEntireOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log('cancel entire order : ', orderId);
    
    const userId = req.user ? req.user.id : req.session.userId;

    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.orderStatus === "delivered" || order.orderStatus === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot cancel this order" });
    }

    const items = await OrderedItem.find({ orderId });

    for (const item of items) {
      if (item.status !== "cancelled") {
        item.status = "cancelled";
        await item.save();

        if (item.variantId) {
          // await Variant.findByIdAndUpdate(item.variantId, {
          //   $inc: { stock: item.quantity }
          // });
          await increaseStock(item.variantId, item.quantity);
        }
      }
    }

   // ----- REFUND TO WALLET -----
    const Wallet = require("../../models/walletSchema");
    const WalletTransaction = require("../../models/walletTransactionSchema");

    const refundAmount = order.totalPrice; // full paid amount

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: refundAmount });
    } else {
      wallet.balance += refundAmount;
      await wallet.save();
    }

    await WalletTransaction.create({
      userId,
      type: "credit",
      title: "refund",
      amount: refundAmount,
      status: "success",
      payment_method: "wallet",
      order_id: order._id,
      transactionId: `REFUND-${order.orderId}-${Date.now()}`
    });

    // Update order
 order.orderStatus = "cancelled";
    order.deliveryCharge = 0;
    order.platformFee = 0;
    order.couponDiscount = 0;
    await order.save();



return res.redirect("/orders");
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};



// const cancelOrderedItem = async (req, res) => {
//   try {
//     const itemId = req.params.itemId;
//     console.log("Cancelling item:", itemId);

//     const item = await OrderedItem.findById(itemId);
//     if (!item) return res.status(404).json({ success: false, message: "Item not found" });

//     const order = await Order.findById(item.orderId);
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     if (order.orderStatus === "delivered" || order.orderStatus === "cancelled") {
//       return res.status(400).json({ success: false, message: "Delivered order items cannot be cancelled" });
//     }

//     item.status = "cancelled";
//     await item.save();

//     if (item.variantId) {
//       // await Variant.findByIdAndUpdate(item.variantId, {
//       //   $inc: { stock: item.quantity }
//       // });
//       await increaseStock(item.variantId, item.quantity);
//     }

//     // Check if all items cancelled → cancel entire order
//     const remaining = await OrderedItem.countDocuments({
//       orderId: item.orderId,
//       status: { $ne: "cancelled" }
//     });

//     if (remaining === 0) {
//       order.orderStatus = "cancelled";
//       await order.save();
//     }

// return res.redirect("/orders");

//   } catch (error) {
//     console.error("Error cancelling item:", error);
//     res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// };
const cancelOrderedItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;

    // 1️⃣ Find the ordered item
    const item = await OrderedItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // 2️⃣ Find the order
    const order = await Order.findById(item.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 3️⃣ Check if order is modifiable
    if (["delivered", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Order cannot be modified" });
    }

    // 4️⃣ Check coupon validity before cancelling
    if (order.couponApplied) {
      const coupon = await Coupon.findById(order.couponApplied);
      if (coupon && coupon.minOrderAmount) {
        const otherItems = await OrderedItem.find({
          orderId: order._id,
          _id: { $ne: item._id },
          status: { $ne: "cancelled" }
        }).lean();

        const remainingTotal = otherItems.reduce((sum, i) => sum + (i.finalPrice * i.quantity || 0), 0);

        if (remainingTotal < coupon.minOrderAmount) {
          return res.status(400).json({
            success: false,
            message: `Cannot cancel this item. Remaining order total (${remainingTotal}) is below coupon minimum (${coupon.minOrderAmount})`
          });
        }
      }
    }

    // 5️⃣ Cancel the item
    item.status = "cancelled";
    await item.save();

    // 6️⃣ Restore stock if variant exists
    if (item.variantId) {
      await increaseStock(item.variantId, item.quantity);
    }

    // 7️⃣ Prepare refund
    let refundAmount = item.subtotal || (item.finalPrice * item.quantity);

    // Count remaining active (not cancelled) items
    const remainingItems = await OrderedItem.find({
      orderId: order._id,
      status: { $ne: "cancelled" }
    });

    if (remainingItems.length === 0) {
      // All items cancelled → refund delivery + platform fee
      refundAmount += (order.deliveryCharge || 0) + (order.platformFee || 0);

      order.orderStatus = "cancelled";
      order.deliveryCharge = 0;
      order.platformFee = 0;
      order.couponDiscount = 0;
      await order.save();
    } else {
      // Some items still delivered → partial refund
      order.orderStatus = "partially_fulfilled";
      await order.save();
    }

    refundAmount = Number(refundAmount.toFixed(2));

    // 8️⃣ Update wallet balance
    await Wallet.findOneAndUpdate(
      { userId: order.user_id },
      { $inc: { balance: refundAmount } },
      { new: true, upsert: true }
    );

    // 9️⃣ Log wallet transaction
    await WalletTransaction.create({
      userId: order.user_id,
      type: "credit",
      title: "refund",
      amount: refundAmount,
      payment_method: "wallet",
      order_id: order._id,
      transactionId: `refund_${order._id}_${Date.now()}`
    });

    return res.json({ success: true, message: "Item cancelled successfully", refundAmount });

  } catch (error) {
    console.error("Error cancelling item:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};




const returnEntireOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { reason } = req.body;
    const userId = req.user ? req.user.id : req.session.userId;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Return reason required" });
    }

    // Find order
    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });


    // Already requested?
    if (order.orderStatus === "return_requested") {
      return res.json({ success: false, message: "Return already requested" });
    }

    // Mark entire order status only
    order.orderStatus = "return_requested";
    order.returnReason = reason;
    await order.save();


    // Mark every item
    await OrderedItem.updateMany(
      { orderId },
      { $set: { status: "return_requested", returnReason: reason } }
    );

    return res.json({ success: true, message: "Return request submitted. Await admin approval." });
  } catch (err) {
    console.error("Return entire order error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {loadOrdersPage, loadOrderSuccessPage, cancelEntireOrder, cancelOrderedItem, returnEntireOrder};