const cron = require("node-cron");
const Order = require("../models/orderSchema");
const OrderedItem = require("../models/orderedItemSchema");
const { releaseStock } = require("../helpers/stockController");

cron.schedule("*/2 * * * *", async () => {
  console.log("Checking expired unpaid orders...");
  

  const expiredOrders = await Order.find({
    paymentStatus: "failed",
    orderStatus: { $ne: "cancelled" },
    expiresAt: { $lt: new Date() }
  });

 console.log("Expired orders found:", expiredOrders.length);

  for (const order of expiredOrders) {

    const items = await OrderedItem.find({ orderId: order._id });

    for (const item of items) {
      if (item.variantId) {
        await releaseStock(item.variantId, item.quantity);
      }
    }
  

    order.expiresAt = null;
    order.orderStatus = "cancelled";
    await order.save();

    console.log(`Stock released for order ${order.orderId}`);
  }
});
