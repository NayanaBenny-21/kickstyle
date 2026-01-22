const Order = require("../../models/orderSchema");
const OrderedItem = require("../../models/orderedItemSchema");
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const { increaseStock } = require('../../helpers/stockController');
const PDFDocument = require('pdfkit');
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const path = require("path");
const { formatLocalDate } = require('../../helpers/dateFormatter');
const CouponUsage = require("../../models/couponUsageSchema");
const Coupon = require("../../models/couponSchema");


const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user?._id || req.session.userId;
    const orderId = req.params.orderId;
    const itemId = req.params.itemId; // make sure your route has /orders/:orderId/item/:itemId

    if (!userId) return res.redirect("/auth/login");

    // Fetch the ordered item
    const item = await OrderedItem.findById(itemId).lean();
    if (!item) return res.status(404).send("Item not found");

    // Ensure the item belongs to this order
    if (item.orderId.toString() !== orderId) return res.status(403).send("Unauthorized access");

    // Format delivery date for this item
    item.formattedDeliveryDate = item.deliveryDate
      ? new Date(item.deliveryDate).toISOString().split("T")[0]
      : null;

    // Fetch the order for summary and address
    const order = await Order.findOne({ _id: orderId, user_id: userId })
      .lean()
      .populate("shippingAddressId")
      .populate("couponApplied");
    if (!order) return res.status(404).send("Order not found");

    // Format expected delivery date for display
let expectedDeliveryDate;
if (order.expectedDeliveryDate) {
  expectedDeliveryDate = formatLocalDate(order.expectedDeliveryDate);
} else {
  const expected = new Date(order.createdAt);
  expected.setDate(expected.getDate() + 10);
  expectedDeliveryDate = formatLocalDate(expected);
}

item.formattedDeliveryDate = item.deliveryDate
  ? formatLocalDate(item.deliveryDate)
  : null;



          const orderedItems = await OrderedItem.find({ orderId }).lean();
          const hasInvoiceEligibleItems = orderedItems.some(item =>
         !["cancelled", "returned"].includes(item.status)
          );

    const fullOrderSubtotal = orderedItems.reduce((acc, it) => {
      return acc + it.finalPrice * it.quantity;
    }, 0);
    // Summary calculation for this single item
    const sellingPrice = item.finalPrice ;
    const subTotal = item.finalPrice * item.quantity;
    const delivery = fullOrderSubtotal >= 1000 ? 0 : 40;
    const platformFee = 7;
    const couponDiscount = order.couponApplied ? order.couponApplied.discount : 0;
    const grandTotal = subTotal;
    

    // ================= BUTTON VISIBILITY LOGIC =================

// Cancel button should be visible ONLY if:
item.canCancel =
  order.orderStatus !== "payment_failed" &&
  !["delivered", "cancelled", "returned", "return_requested"].includes(item.status);

// Return button should be visible ONLY if:
item.canReturn =
  order.orderStatus !== "payment_failed" &&
  item.status === "delivered";

    // Render single item page
    res.render("user/orderDetailsPage", {
      order: { ...order, expectedDeliveryDate},
      address: order.shippingAddressId,
      summary: { sellingPrice, shipping: delivery, marketplaceFee: platformFee, grandTotal },
      item,
      canDownloadInvoice: hasInvoiceEligibleItems
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const rateProduct = async (req, res) => {
  try {
    const { itemId, rating } = req.body;
    const userId = req.user?._id || req.session.userId;

console.log("Getting rating : ", rating);


    if (!itemId || !rating) return res.json({ success: false, message: "Invalid data" });

    const item = await OrderedItem.findById(itemId);
    if (!item) return res.json({ success: false, message: "Item not found" });

    // Only delivered items can be rated
    if (item.status !== "delivered") {
      return res.json({ success: false, message: "Only delivered items can be rated" });
    }

    // Update the rating field
    item.rating = rating;
    await item.save();
 console.log("Rating saved:", rating, "for item:", itemId);
    return res.json({ success: true, message: "Rating saved successfully" });

  } catch (err) {
    console.error("Rate product error:", err);
    return res.json({ success: false, message: "Server error" });
  }
};

const cancelOrderedItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;

    const item = await OrderedItem.findById(itemId);
    if (!item) return res.status(404).send("Item not found");

    const order = await Order.findById(item.orderId);
    if (!order) return res.status(404).send("Order not found");

   if (
  ["delivered", "cancelled", "returned", "return_requested"].includes(item.status)
) {
  return res
    .status(400)
    .send("This item cannot be cancelled");
}


    item.status = "cancelled";
    await item.save();

    if (item.variantId) {
      await increaseStock(item.variantId, item.quantity);
    }
    const remaining = await OrderedItem.countDocuments({
      orderId: item.orderId,
      status: { $ne: "cancelled" }
    });

    if (remaining === 0) {
      order.orderStatus = "cancelled";
            order.deliveryCharge = 0;
      order.platformFee = 0;
      order.couponDiscount = 0;
      await order.save();
    }
 return res.redirect(`/orders/${item.orderId}/item/${item._id}`);


  } catch (err) {
    console.error("Error cancelling item:", err);
    res.status(500).send("Server error");
  }
};

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user?._id || req.session.userId;

    // Fetch order with coupon and shipping address
    const order = await Order.findOne({ orderId, user_id: userId })
      .populate("couponApplied")
      .populate("shippingAddressId")
      .lean();

    if (!order) return res.status(404).send("Order not found");

    // Fetch all items for this order (excluding cancelled/returned)
    const items = await OrderedItem.find({
      orderId: order._id,
      status: { $nin: ["cancelled", "returned"] },
    })
      .populate("productId")
      .lean();

    if (!items || items.length === 0) return res.status(404).send("No items found");

    const address = order.shippingAddressId;

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order.orderId}.pdf`
    );
    doc.pipe(res);

    // ========== HEADER ==========
    doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", { align: "center" });
    doc.moveDown(1.5);

    const leftX = 40;
    const rightX = 350;

    // Seller Info
    doc.fontSize(12).font("Helvetica-Bold").text("Seller: Kickstyle", leftX);
    doc.fontSize(10).font("Helvetica").text(
      `B2/17, 1st Floor, Sumit House,
Mohan Cooperative Industrial Estate, Badarpur,
Behind Badarpur Metro Station,
New Delhi 110044`,
      leftX
    );

    // Order Info
    doc.fontSize(10).font("Helvetica-Bold").text(
      `Invoice Number: #${order.invoiceId || "INV" + Date.now()}`,
      rightX,
      110
    );
    doc.font("Helvetica").text(`Order Number: ${order.orderId}`, rightX);
    doc.text(`Order Date: ${new Date(order.createdAt).toDateString()}`, rightX);
    doc.text(`Invoice Date: ${new Date().toDateString()}`, rightX);

    doc.moveTo(40, 180).lineTo(560, 180).stroke();

    // Billing info
    doc.moveDown();
    doc.fontSize(12).font("Helvetica-Bold").text("Bill To / Ship To :", 40);
    doc.fontSize(10).font("Helvetica")
      .text(address.name)
      .text(address.house)
      .text(`${address.city}, ${address.state}, ${address.pincode}`)
      .text(`Phone: ${address.mobile || address.phone}`);

    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();

    // ================= TABLE HEADER =================
    const tableTop = doc.y + 15;
    const colX = { product: 40, qty: 260, price: 330, discount: 400, charges: 470, total: 540 };
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("Product", colX.product, tableTop);
    doc.text("Qty", colX.qty, tableTop);
    doc.text("Price ₹", colX.price, tableTop);
    doc.text("Discount ₹", colX.discount, tableTop);
    doc.text("Other ₹", colX.charges, tableTop);
    doc.text("Total ₹", colX.total, tableTop);
    doc.moveTo(40, tableTop + 18).lineTo(560, tableTop + 18).stroke();

    // ================= ITEMS ROWS =================
    let y = tableTop + 30;
    let totalQty = 0;
    let totalItemAmount = 0;
    let totalItemDiscount = 0;

    items.forEach(item => {
      const rowTotal = item.finalPrice * item.quantity;
      const rowDiscount = item.discount || 0;

      doc.fontSize(10).font("Helvetica");
      doc.text(item.productName, colX.product, y, { width: 200 });
      doc.text(item.quantity.toString(), colX.qty, y);
      doc.text(item.finalPrice.toFixed(2), colX.price, y);
      doc.text(rowDiscount.toFixed(2), colX.discount, y);
      doc.text("-", colX.charges, y);
      doc.text((rowTotal - rowDiscount).toFixed(2), colX.total, y);

      totalQty += item.quantity;
      totalItemAmount += rowTotal;
      totalItemDiscount += rowDiscount;

      y += 25;
    });

    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 10;

    // ================= CHARGES =================
    const shippingCharge = order.deliveryCharge || (totalItemAmount < 1000 ? 40 : 0);
    const platformFee = order.platformFee || 7;
    const couponDiscount = order.couponDiscount || 0; // applied once per order
    let totalBeforeGrand = totalItemAmount - totalItemDiscount + shippingCharge + platformFee;

    // Shipping Charges row
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Shipping Charges", colX.product, y);
    doc.text("-", colX.qty, y);
    doc.text(shippingCharge.toFixed(2), colX.price, y);
    doc.text("-", colX.discount, y);
    doc.text("-", colX.charges, y);
    doc.text(shippingCharge.toFixed(2), colX.total, y);
    y += 25;

    // Platform Fee row
    doc.text("Platform Fee", colX.product, y);
    doc.text("-", colX.qty, y);
    doc.text(platformFee.toFixed(2), colX.price, y);
    doc.text("-", colX.discount, y);
    doc.text("-", colX.charges, y);
    doc.text(platformFee.toFixed(2), colX.total, y);
    y += 25;

    // Coupon Discount row (if any)
    if (couponDiscount > 0) {
      doc.text("Coupon Discount", colX.product, y);
      doc.text("-", colX.qty, y);
      doc.text("-", colX.price, y);
      doc.text(couponDiscount.toFixed(2), colX.discount, y);
      doc.text("-", colX.charges, y);
      doc.text(`-${couponDiscount.toFixed(2)}`, colX.total, y);
      y += 25;
    }

    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 10;

    // ================= TOTALS =================
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Total (Before Coupon)", colX.product, y);
    doc.text(totalQty.toString(), colX.qty, y);
    doc.text(totalItemAmount.toFixed(2), colX.price, y);
    doc.text(totalItemDiscount.toFixed(2), colX.discount, y);
    doc.text((shippingCharge + platformFee).toFixed(2), colX.charges, y);
    doc.text(totalBeforeGrand.toFixed(2), colX.total, y);
    y += 30;

    // ================= GRAND TOTAL =================
    const grandTotal = totalBeforeGrand - couponDiscount;
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text("Grand Total", 350, y);
    doc.text(`₹ ${grandTotal.toFixed(2)}`, 520, y);
    doc.moveTo(40, y + 30).lineTo(560, y + 30).stroke();

    // ================= LOGO & FOOTER =================
    const logoPath = path.join(__dirname, "../../public/images/logo.jpg");
    try {
      doc.image(logoPath, 430, y + 50, { width: 70 });
    } catch {
      console.log("Logo not found");
    }

    doc.fontSize(10).font("Helvetica").text("Thank You!\nfor shopping with us", 450, y + 120, { align: "center" });
    doc.fontSize(8).text(
      `The goods sold are intended for end user consumption and not for re-sale.
For queries, contact: support@kickstyle.com`,
      40, y + 160
    );

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating invoice");
  }
};
  



const returnOrderedItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { reason } = req.body;

    const item = await OrderedItem.findById(itemId);
    if (!item) {
      return res.json({ success: false, message: "Item not found" });
    }

    // Only delivered items can be requested for return
    if (item.status !== "delivered") {
      return res.json({
        success: false,
        message: "Return can only be requested after delivery"
      });
    }

    // Prevent duplicate return requests
    if (item.status === "return_requested") {
      return res.json({
        success: false,
        message: "Return already requested"
      });
    }

    // 🔍 Find full order
    const order = await Order.findById(item.orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // 1️⃣ Coupon validation
    if (order.couponApplied) {
      const coupon = await Coupon.findById(order.couponApplied);

      if (coupon?.minOrderAmount) {
        // Other active items (exclude THIS item)
        const otherItems = await OrderedItem.find({
          orderId: order._id,
          _id: { $ne: item._id },
          status: { $nin: ["cancelled", "returned", "return_requested"] }
        });

        const remainingTotal = otherItems.reduce(
          (sum, i) => sum + Number(i.finalPrice * i.quantity || 0),
          0
        );

        if (remainingTotal < coupon.minOrderAmount) {
          return res.json({
            success: false,
            message: `This return is not allowed. Remaining total (${remainingTotal}) will drop below coupon minimum (${coupon.minOrderAmount}).`
          });
        }
      }
    }

    // 2️⃣ If coupon still valid → mark item return_requested
    item.status = "return_requested";
    item.returnReason = reason;
    item.returnRequestedAt = new Date();
    await item.save();

    return res.json({
      success: true,
      message: "Return request sent. Waiting for admin review."
    });

  } catch (err) {
    console.error("Return request error:", err);
    return res.json({ success: false, message: "Server error" });
  }
};



module.exports = { getOrderDetails, rateProduct, cancelOrderedItem, generateInvoice, returnOrderedItem};
