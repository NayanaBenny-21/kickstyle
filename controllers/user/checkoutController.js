const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Coupon = require('../../models/couponSchema');
const CouponUsage = require('../../models/couponUsageSchema');
const Order = require('../../models/orderSchema');
const OrderedItem = require('../../models/orderedItemSchema');
const { decreaseStock ,reserveStock,confirmStock, checkStock} = require('../../helpers/stockController');
const TransactionHistory = require('../../models/transactionHistorySchema');
const Wallet = require("../../models/walletSchema");
const WalletTransaction = require("../../models/walletTransactionSchema");

// Load Checkout Page
const loadCheckOutPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) return res.redirect('/auth/login');

    const selectedAddress = req.session.selectedAddress
      ? await Address.findOne({ _id: req.session.selectedAddress, userId }).lean()
      : null;

  const cart = await Cart.findOne({ user_id: userId })
  .populate(
    'items.productId',
    'product_name final_price images sku rating isActive'
  )
  .populate('items.variantId', 'color size image sku')
  .lean();

//  CHECK PRODUCT AVAILABILITY
const unavailableItem = cart.items.find(
  item => !item.productId || item.productId.isActive === false
);

if (unavailableItem) {
  return res.render('user/productUnavailable', {
    message: 'One or more products in your cart are currently unavailable'
  });
}


    cart.items = cart.items.map(item => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity),
      productName: item.productId?.product_name || 'Unknown Product'
    }));

 
const total = cart.items.reduce((a, item) => a + item.price * item.quantity, 0);
const deliveryCharge = total >= 1000 ? 0 : 40;
const platformFee = 7;
const couponDiscount = req.session.coupon?.discount || 0;
const finalTotal = total + deliveryCharge + platformFee - couponDiscount;


res.render('user/checkOutPage', {
  user: req.session.user,
  cart,
  subtotal: total,           
  deliveryCharge,
  platformFee,
  couponDiscount,
  finalTotal,
  selectedAddress,
  razorpayKey: process.env.RAZORPAY_KEY_ID,
  coupon: req.session.coupon || null  
});


    
  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(500).send('Server error');
  }
};


const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;


    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const now = new Date();

    
    const usedCoupons = await CouponUsage.find({ user_id: userId })
      .select("coupon_id")
      .lean();

    const usedCouponIds = usedCoupons.map(c => c.coupon_id);

    // 2️⃣ Fetch available coupons
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: now },
      _id: { $nin: usedCouponIds }
    }).lean();
console.log("Available coupons : ", coupons)
    res.json({
      success: true,
      coupons
    });

  } catch (err) {
    console.error("Available coupons error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// Apply Coupon
const applyCoupon = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    const { couponCode } = req.body;
    if (!userId) return res.status(401).json({ success: false, message: 'User not found' });
    if (!couponCode) return res.status(400).json({ success: false, message: 'Enter a coupon code' });

    const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const now = new Date();
    if (now < coupon.startDate) return res.status(400).json({ success: false, message: 'Coupon not started yet' });
    if (now > coupon.expiryDate) return res.status(400).json({ success: false, message: 'Coupon has expired' });

    const cart = await Cart.findOne({ user_id: userId })
      .populate('items.productId', 'product_name images sku rating')
      .populate('items.variantId', 'color size image sku')
      .lean();

    if (!cart) return res.redirect('/cart');

    cart.items = cart.items.map(item => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity),
      productName: item.productId?.product_name || 'Unknown Product'
    }));

    const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    if (subtotal < coupon.minOrderAmount)
      return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrderAmount}` });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });

    let discount;
    if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    } else {
      discount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity);
    }

    discount = Math.round(discount);

    // Store coupon in session
    req.session.coupon = { code: coupon.couponCode, discount, couponId: coupon._id , minOrderAmount: coupon.minOrderAmount };

    res.json({ success: true, message: 'Coupon applied!', discount, couponId: coupon._id,  minOrderAmount: coupon.minOrderAmount  });

  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Place Order (COD or Razorpay)
const placeOrder = async (req, res) => {
  try {
    console.log("Place Order called", req.body);

    const userId = req.user?.id || req.session.userId;
    const { shippingAddressId, paymentMethod, transactionId } = req.body;

    if (!userId) return res.redirect('/auth/login');
    if (!shippingAddressId) return res.status(400).json({ success: false, message: 'No shipping address selected' });
    if (paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Razorpay orders are created after successful payment only."
      });
    }

    const selectedAddress = await Address.findOne({ _id: shippingAddressId, userId }).lean();
    if (!selectedAddress) return res.status(400).json({ success: false, message: 'Invalid address' });

    const cart = await Cart.findOne({ user_id: userId }).populate('items.productId items.variantId').lean();
    if (!cart || !cart.items.length) return res.status(400).json({ success: false, message: 'Cart is empty' });
    // ---------- Check availability ----------
   const removedItems = [];
const availableItems = [];

for (const item of cart.items) {
  if (!item.productId || !item.productId.isActive) {
    removedItems.push(item.productId?.product_name || 'Unknown Product');
    continue;
  }

  if (item.variantId) {
    const stockAvailable = await checkStock(item.variantId._id, item.quantity); 
    if (!stockAvailable) {
      removedItems.push(item.productId?.product_name || 'Out of stock');
    } else {
      availableItems.push(item); 
    }
  } else {
    availableItems.push(item);
  }
}

// Single-item cart unavailable
if (cart.items.length === 1 && removedItems.length === 1) {
  return res.json({
    success: false,
    message: `${removedItems[0]} is out of stock!`,
    redirect: '/cart'
  });
}

// Multi-item cart: remove unavailable items
if (removedItems.length > 0) {
  await Cart.findByIdAndUpdate(cart._id, { items: availableItems });
  return res.json({
    success: false,
    removedItems,
    message: 'Some products were removed as they are out of stock'
  });
}

    const subtotal = cart.items.reduce((a, item) => a + item.productId.final_price * item.quantity, 0);
    const deliveryCharge = subtotal >= 1000 ? 0 : 40;
    const platformFee = 7;
    const couponDiscount = req.session.coupon?.discount || 0;
    const totalPrice = subtotal + deliveryCharge + platformFee - couponDiscount;
        if (paymentMethod === 'cod' && totalPrice > 1000) {
      return res.status(400).json({
        success: false,
        message: "COD is not allowed for orders above ₹1000."
      });
    }

    const generateOrderId = () => "ORD-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    let orderId = generateOrderId();
    while (await Order.findOne({ orderId })) orderId = generateOrderId();

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 10);

//     for (const item of cart.items) {
//   if (item.variantId) {
//     const reserved = await reserveStock(item.variantId._id, item.quantity);

//     if (!reserved) {
//       return res.status(400).json({
//         success: false,
//         message: `${item.productId.product_name} is out of stock`
//       });
//     }
//   }
// }

    const order = await Order.create({
      orderId,
      user_id: userId,
      transactionId: transactionId || null,
      couponApplied: req.session.coupon?.couponId || null,
        shippingAddress: {
    name: selectedAddress.name,
    mobile: selectedAddress.mobile,
    pincode: selectedAddress.pincode,
    locality: selectedAddress.locality,
    addressLine: selectedAddress.addressLine,
    city: selectedAddress.city,
    state: selectedAddress.state,
    landmark: selectedAddress.landmark,
    addressType: selectedAddress.addressType
  },

      totalPrice,
      paymentMethod,
      deliveryCharge,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'success',
      expiresAt: paymentMethod === 'cod'? new Date(Date.now() + 15 * 60 * 1000): null, // 15 minutes expiry
      orderStatus: 'pending',
      deliveryDate: expectedDelivery
    });

    // Create Ordered Items with required fields
    const orderedItems = cart.items.map(item => ({
      orderId: order._id,
      productId: item.productId?._id,
      variantId: item.variantId?._id,
      quantity: item.quantity || 1,
      sku: item.variantId?.sku || item.productId?.sku || 'NA',
      productName: item.productId?.product_name || 'Unknown Product',
      color: item.variantId?.color || 'Default',
      size: item.variantId?.size || null,
      basePrice: item.productId?.final_price || 0,
      finalPrice: item.productId?.final_price || 0,
      subtotal: (item.productId?.final_price || 0) * (item.quantity || 1),
      image: item.variantId?.image || item.productId?.images?.[0],
      rating: item.productId?.rating || null,
      expectedDeliveryDate: expectedDelivery
    }));

    await OrderedItem.insertMany(orderedItems);

   
    // Record coupon usage
    if (req.session.coupon?.couponId) {
      await CouponUsage.create({ user_id: userId, coupon_id: req.session.coupon.couponId, usedAt: new Date() });
      await Coupon.findByIdAndUpdate(req.session.coupon.couponId, { $inc: { usedCount: 1 } });
    }
    await TransactionHistory.create({
      user_id: userId,
      title: "Order Payment",
      amount: totalPrice,
      status: "pending",
      payment_method: "cod",
      order_id: order._id,
      transactionId: "COD-" + orderId
    });

    console.log("✔ COD TRANSACTION HISTORY CREATED");


    console.log('TRANSACTION HISTORY CREATED SUCCESSFULLY!');
    cart.items = [];
    await Cart.findByIdAndUpdate(cart._id, { items: [] });
    req.session.coupon = null;
console.log("Orders made coupon session after : ", req.session.coupon);
    res.json({ success: true, message: 'Order placed successfully!', orderId: order._id });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ================= WALLET BALANCE CHECK ================= */
const checkWalletBalance = async (req, res) => {
  try {
const userId = req.user?.id || req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { amount } = req.body || {};
    if (amount === undefined) return res.status(400).json({ success: false, message: "Amount is required" });

let wallet = await Wallet.findOne({ userId });

if (!wallet) {
  wallet = await Wallet.create({ userId, balance: 0 });
}

    const canUseWallet = wallet.balance >= Number(amount || 0);

    res.json({ 
      success: true, 
      balance: wallet.balance, 
      canUseWallet 
    });
  } catch (err) {
    console.error("Wallet balance check failed:", err);
    res.status(500).json({ success: false, balance: 0 });
  }
};

/* ================= CREATE WALLET ORDER ================= */
const createWalletOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.session.userId;
    const { shippingAddressId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });
    // if (!shippingAddressId) return res.status(400).json({ success: false, message: "Shipping address is required" });
const address = await Address.findOne({
  _id: shippingAddressId,
  userId: userId
});

if (!address) {
  return res.status(400).json({
    success: false,
    message: "Invalid shipping address"
  });
}

   const validation = await validateCart(userId);

    // 🔴 Single item & out of stock
    if (validation.singleItemOut) {
      return res.json({
        success: false,
        message: `${validation.removedItems[0]} is out of stock`,
        redirect: "/cart"
      });
    }

    // 🔴 Multi items removed
    if (validation.removedItems?.length) {
      return res.json({
        success: false,
        removedItems: validation.removedItems,
        message: "Some products were removed"
      });
    }

    const cart = validation.cart;


    //const cart = await Cart.findOne({ user_id: userId }).populate("items.productId items.variantId");
    if (!cart || cart.items.length === 0) return res.status(400).json({ success: false, message: "Cart is empty" });

    const subtotal = cart.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    const deliveryCharge = subtotal >= 1000 ? 0 : 40;
    const platformFee = 7;
    const couponDiscount = req.session.coupon?.discount || 0;

    const totalAmount = subtotal + deliveryCharge + platformFee - couponDiscount;
    if (!totalAmount || isNaN(totalAmount)) return res.status(400).json({ success: false, message: "Invalid amount" });

    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < totalAmount) return res.status(400).json({ success: false, message: "Insufficient wallet balance" });

    // Deduct wallet balance
    wallet.balance -= totalAmount;
    await wallet.save();

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 10);

    for (const item of cart.items) {
  if (item.variantId) {
    const reserved = await reserveStock(item.variantId._id, item.quantity);

    if (!reserved) {
      return res.status(400).json({
        success: false,
        message: `${item.productId.product_name} is out of stock`
      });
    }
  }
}

const shippingAddressSnapshot = {
  name: address.name,
  mobile: address.mobile,
  pincode: address.pincode,
  locality: address.locality,
  addressLine: address.addressLine,
  city: address.city,
  state: address.state,
  landmark: address.landmark,
  addressType: address.addressType
};

    // ✅ Include shippingAddressId and transactionId
    const order = await Order.create({
      orderId: "ORD-" + Date.now(),
      user_id: userId,
      totalPrice: totalAmount,
      paymentMethod: "wallet",
      paymentStatus: "success",
      orderStatus: "pending",
      deliveryCharge,
      shippingAddress: shippingAddressSnapshot,
      transactionId: "WALLET-" + Date.now(), 
      couponApplied: req.session.coupon?.couponId || null,
      couponCode: req.session.coupon?.code || null,
      couponDiscount,
      deliveryDate: expectedDelivery
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
      basePrice: item.price,
      discount: item.productId.discount || 0,
      finalPrice: item.price,
      subtotal: item.price * item.quantity,
      image: item.variantId?.image || item.productId.images[0],
      status: "pending",
      deliveryDate: expectedDelivery
    }));
    await OrderedItem.insertMany(orderedItems);

    for (const item of cart.items) {
  if (item.variantId) {
    await confirmStock(item.variantId._id, item.quantity);
  }
}

   
    // Wallet transaction
    await WalletTransaction.create({
      userId,
      type: "debit",
      title: "order_payment",
      amount: totalAmount,
      status: "success",
      payment_method: "wallet",
      order_id: order._id,
      transactionId: "WALLET-" + Date.now()
    });
if (req.session.coupon?.couponId) {
  // Save in CouponUsage collection
  await CouponUsage.create({
    user_id: userId,
    coupon_id: req.session.coupon.couponId,
    usedAt: new Date(),
order_id: order._id
  });

  // Increment usedCount in Coupon
  await Coupon.findByIdAndUpdate(req.session.coupon.couponId, { $inc: { usedCount: 1 } });
}
    // Clear cart and session coupon
    cart.items = [];
    await cart.save();
    delete req.session.coupon;

    res.json({ success: true, redirect: `/order-success/${order._id}` });

  } catch (err) {
    console.error("WALLET ORDER ERROR FULL:", err);
    res.status(500).json({ success: false, message: "Wallet Payment Failed" });
  }
};


const checkAvailability = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cart = await Cart.findOne({ user_id: userId })
      .populate("items.productId")
      .lean();

    if (!cart || !cart.items.length) {
      return res.json({ success: true, removedItems: [] });
    }

    let removedItems = [];
    let availableItems = [];

    for (const item of cart.items) {
      if (!item.productId || !item.productId.isActive) {
        removedItems.push(item.productId?.product_name || "Unknown Product");
        continue;
      }

      if (item.variantId) {
        const inStock = await checkStock(item.variantId, item.quantity);

        if (!inStock) {
          removedItems.push(item.productId.product_name);
        } else {
          availableItems.push(item);
        }
      } else {
        availableItems.push(item);
      }
    }

    // 🔥 IMPORTANT LOGIC
    if (cart.items.length === 1 && removedItems.length === 1) {
      // Only one product and it is out of stock
      return res.json({
        success: false,
        redirectToCart: true,
        message: "Product is out of stock"
      });
    }

    // Remove unavailable products if more than one
    if (removedItems.length > 0) {
      await Cart.updateOne(
        { user_id: userId },
        { $set: { items: availableItems } }
      );
    }

    return res.json({
      success: true,
      removedItems
    });

  } catch (err) {
    console.error("Check availability error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};





module.exports = { loadCheckOutPage, getAvailableCoupons , applyCoupon, placeOrder,checkWalletBalance ,createWalletOrder, checkAvailability };
