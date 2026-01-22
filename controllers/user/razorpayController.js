const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../models/orderSchema");
const OrderedItem = require("../../models/orderedItemSchema");
const TransactionHistory = require("../../models/transactionHistorySchema");
const Cart = require("../../models/cartSchema");
const { decreaseStock } = require("../../helpers/stockController");
const CouponUsage = require("../../models/couponUsageSchema");
const Coupon = require("../../models/couponSchema");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ======================================================
   CREATE RAZORPAY ORDER
====================================================== */
const createRazorPayOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    const user = req.user || req.session.user;

    // 🔴 ADDED: auth clarity
    if (!userId) {
      console.error("CREATE ORDER ❌ USER NOT AUTHENTICATED");
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // 🔴 ADDED: Razorpay config guard
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY KEYS MISSING");
      return res.status(500).json({
        success: false,
        message: "Payment configuration error"
      });
    }

    const cart = await Cart.findOne({ user_id: userId })
      .populate("items.productId items.variantId");

    // 🔴 ADDED: cart clarity
    if (!cart || cart.items.length === 0) {
      console.error("CREATE ORDER ❌ CART EMPTY", userId);
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

   const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const deliveryCharge = subtotal >= 1000 ? 0 : 40;
const platformFee = 7;
const couponDiscount = req.session.coupon?.discount || 0;
const totalAmount = subtotal + deliveryCharge + platformFee - couponDiscount;

const razorpayOrder = await razorpay.orders.create({
  amount: totalAmount * 100, // paise
  currency: "INR",
  receipt: `rcpt_${Date.now()}`,
  payment_capture: 1
});
    res.json({
      success: true,
      order: razorpayOrder,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      userDetails: {
        name: user?.name,
        email: user?.email,
        phone: user?.phone
      }
    });

  } catch (err) {
    console.error("CREATE RAZORPAY ORDER ERROR FULL:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order"
    });
  }
};

/* ======================================================
   VERIFY PAYMENT
====================================================== */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddressId
    } = req.body;

    const userId = req.user?.id || req.session.userId;

    if (!userId) {
      console.error("VERIFY ❌ USER ID MISSING");
      return res.status(401).json({
        success: false,
        message: "Authentication failed"
      });
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !shippingAddressId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment data"
      });
    }

    // ✅ signature verify (UNCHANGED)
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    const cart = await Cart.findOne({ user_id: userId })
      .populate("items.productId items.variantId");

    // 🔴 ADDED: fail-fast guard
    if (!cart || cart.items.length === 0) {
      console.error("VERIFY ❌ CART EMPTY AFTER PAYMENT", userId);
      return res.status(400).json({
        success: false,
        message: "Cart already processed"
      });
    }

 const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const deliveryCharge = subtotal >= 1000 ? 0 : 40;
    const platformFee = 7;
    const couponDiscount = req.session.coupon?.discount || 0;
    const couponId = req.session.coupon?.couponId || null;
    const totalPrice = subtotal + deliveryCharge + platformFee - couponDiscount;

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 10);
const couponCode = req.session.coupon?.code || null;
    const order = await Order.create({
      orderId: "ORD-" + Date.now(),
      user_id: userId,
      totalPrice,
      paymentMethod: "razorpay",
      paymentStatus: "success",
      orderStatus: "pending",
      couponApplied: couponId,
      deliveryCharge,
        couponCode,            
  couponDiscount,  
      deliveryDate: expectedDelivery,
      transactionId: razorpay_payment_id,
      shippingAddressId
    });

    const orderedItems = cart.items.map(item => ({
      orderId: order._id,
      productId: item.productId._id,
      variantId: item.variantId?._id || null,
      quantity: item.quantity,
      productName: item.productId.product_name,
      sku: item.variantId?.sku || item.productId.sku || "N/A",
      color: item.variantId?.color || "Default",
      size: item.variantId?.size || null,
      basePrice: item.productId.base_price || item.productId.final_price,
      discount: item.productId.discount || 0,
      finalPrice: item.productId.final_price,
      subtotal: item.quantity * item.productId.final_price,
      image: item.variantId?.image || item.productId.images[0],
      status: "pending",
      deliveryDate: expectedDelivery
    }));

    await OrderedItem.insertMany(orderedItems);

    for (const item of cart.items) {
      if (item.variantId) {
        await decreaseStock(item.variantId._id, item.quantity);
      }
    }

    cart.items = [];
    await cart.save();
    req.session.coupon = null;
    delete req.session.coupon;

    if (couponId) {
      await CouponUsage.create({
        user_id: userId,
        coupon_id: couponId,
        order_id: order._id
      });

      await Coupon.findByIdAndUpdate(couponId, {
        $inc: { usedCount: 1 }
      });
    }

    await TransactionHistory.create({
      user_id: userId,
      title: "Order Payment",
      amount: totalPrice,
      status: "success",
      payment_method: "razorpay",
      order_id: order._id,
      transactionId: razorpay_payment_id
    });

    res.json({
      success: true,
      redirect: `/order-success/${order._id}`
    });

  } catch (err) {
    console.error("VERIFY PAYMENT ERROR FULL:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
};

/* ======================================================
   PAYMENT FAILED
====================================================== */

const paymentFailed = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    const { shippingAddressId } = req.body;

    if (!userId || !shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const cart = await Cart.findOne({ user_id: userId }).populate("items.productId items.variantId");

    if (!cart || cart.items.length === 0) {
      console.error("FAILED PAYMENT ❌ CART EMPTY", userId);
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // ✅ Generate cart hash
    const cartHash = crypto.createHash("md5")
      .update(JSON.stringify(cart.items.map(i => ({ id: i.productId._id, qty: i.quantity, price: i.price }))))
      .digest("hex");

    // ✅ Check for existing failed order
    const existingOrder = await Order.findOne({ user_id: userId, cartHash, orderStatus: "payment_failed" });
    if (existingOrder) {
      console.log("FAILED PAYMENT ❌ Order already exists for this cart");
      return res.json({
        success: false,
        redirect: "/orders"
      });
    }


    // ✅ Create new failed order
const subtotal = cart.items.reduce(
  (sum, item) => sum + item.totalPrice, 0
);
 const deliveryCharge = subtotal >= 1000 ? 0 : 40;
const platformFee = 7;
const couponData = req.session.coupon || null;
const couponDiscount = couponData?.discount || 0;

const couponId = req.session.coupon?.couponId || null;


const totalPrice = subtotal + deliveryCharge + platformFee - couponDiscount;

    const failedOrder = await Order.create({
      orderId: "ORD-" + Date.now(),
      user_id: userId,
      totalPrice,
      paymentMethod: "razorpay",
      paymentStatus: "failed",
      orderStatus: "payment_failed",
      deliveryCharge,
      shippingAddressId,
      transactionId: "FAILED-" + Date.now(),
      cartHash,
        couponCode: req.session.coupon?.code || null,
      couponDiscount: couponDiscount,
      couponApplied: couponId,

    });
console.log("Failed orders : ", failedOrder)
    const failedItems = cart.items.map(item => ({
      orderId: failedOrder._id,
      productId: item.productId._id,
      variantId: item.variantId?._id || null,
      quantity: item.quantity,
      productName: item.productId.product_name,
      sku: item.variantId?.sku || item.productId.sku || "N/A",
      color: item.variantId?.color || "Default",
      size: item.variantId?.size || null,
      basePrice: item.price,
      discount: item.productId.discount || 0,
      finalPrice:  item.price,
      subtotal: item.totalPrice,
      image: item.variantId?.image || item.productId.images[0],
      status: "payment_failed",
      deliveryDate: null
    }));
    console.log("Failed orders items: ", failedItems)

    await OrderedItem.insertMany(failedItems);

    return res.json({
      success: false,
      redirect: "/orders"
    });

  } catch (err) {
    console.error("PAYMENT FAILED ERROR FULL:", err);
    return res.status(500).json({
      success: false,
      message: "Payment processing failed"
    });
  }
};


/* ======================================================
   RETRY PAYMENT
====================================================== */
const retryPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    const { orderId } = req.body;

    if (!userId || !orderId) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // Fetch the existing failed order (not lean, keep Mongoose document)
    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
      orderStatus: "payment_failed"
    });

    if (!order) {
      console.error("RETRY ❌ INVALID ORDER", orderId);
      return res.status(404).json({ success: false, message: "Order not eligible for retry" });
    }

    // Generate unique receipt for Razorpay
    const receiptId = `retry_${order._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100),
      currency: "INR",
      receipt: receiptId,
      payment_capture: 1
    });

    res.json({
      success: true,
      order: razorpayOrder,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      userDetails: {
        name: req.user?.name || req.session.user?.name,
        email: req.user?.email || req.session.user?.email,
        phone: req.user?.phone || req.session.user?.phone
      },
      existingOrderId: order._id
    });

  } catch (err) {
    console.error("RETRY PAYMENT ERROR FULL:", err);
    res.status(500).json({ success: false, message: "Retry failed", error: err.message });
  }
};

/* ======================================================
   VERIFY RETRY PAYMENT
====================================================== */
const verifyRetryPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      originalOrderId,
      shippingAddressId
    } = req.body;

    const userId = req.user?.id || req.session.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !originalOrderId || !shippingAddressId) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    // Verify Razorpay signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Fetch the failed order
    const order = await Order.findOne({
      _id: originalOrderId,
      user_id: userId,
      orderStatus: "payment_failed"
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Update order to successful
    order.paymentStatus = "success";
    order.orderStatus = "pending";
    order.transactionId = razorpay_payment_id;
    order.shippingAddressId = shippingAddressId;
    await order.save();

    // Update ordered items
    const orderedItems = await OrderedItem.find({ orderId: order._id });
    for (const item of orderedItems) {
      item.status = "pending";
      await item.save();

      if (item.variantId) {
        await decreaseStock(item.variantId, item.quantity);
      }
    }

    // Create transaction history
    await TransactionHistory.create({
      user_id: userId,
      title: "Order Payment",
      amount: order.totalPrice,
      status: "success",
      payment_method: "razorpay",
      order_id: order._id,
      transactionId: razorpay_payment_id
    });
if (order.couponApplied) {
  const alreadyUsed = await CouponUsage.findOne({
    user_id: userId,
    coupon_id: order.couponApplied,
    order_id: order._id
  });

  if (!alreadyUsed) {
    await CouponUsage.create({
      user_id: userId,
      coupon_id: order.couponApplied,
      order_id: order._id
    });

    await Coupon.findByIdAndUpdate(order.couponApplied, {
      $inc: { usedCount: 1 }
    });
  }
}
    // Clear user cart
    await Cart.updateOne({ user_id: userId }, { $set: { items: [] } });

    res.json({ success: true, redirect: `/order-success/${order._id}` });
delete req.session.coupon;

  } catch (err) {
    console.error("VERIFY RETRY PAYMENT ERROR FULL:", err);
    res.status(500).json({ success: false, message: "Retry verification failed", error: err.message });
  }
};

module.exports = {
  createRazorPayOrder,
  verifyPayment,
  paymentFailed,
  retryPayment,
  verifyRetryPayment
};
