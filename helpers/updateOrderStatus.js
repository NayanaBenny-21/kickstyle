const mongoose = require('mongoose'); // ← ADD THIS
const OrderedItem = require('../models/orderedItemSchema');
const Order = require('../models/orderSchema');


const updateOrderStatus = async (orderId) => {
  try {
    if (!orderId) return;

    // normalize orderId
    const normalizedOrderId = mongoose.Types.ObjectId.isValid(orderId)
      ? orderId
      : orderId._id;

    const items = await OrderedItem.find({ orderId: normalizedOrderId }).lean();
    if (!items.length) return;

    const statuses = items.map(i => i.status);

    let newStatus = 'pending';

    // Correct priority (top = strongest)
    if (statuses.every(s => s === 'cancelled')) newStatus = 'cancelled';
    else if (statuses.every(s => s === 'delivered')) newStatus = 'delivered';
     else if (statuses.some(s => s === 'delivered') && statuses.some(s => s !== 'delivered')) 
  newStatus = 'partially_fulfilled';
    else if (statuses.some(s => s === 'returned')) newStatus = 'returned';
    else if (statuses.some(s => s === 'return_requested')) newStatus = 'return_requested';
    else if (statuses.some(s => s === 'in-transit')) newStatus = 'in-transit';
    else if (statuses.some(s => s === 'shipped')) newStatus = 'shipped';
    else if (statuses.some(s => s === 'confirmed')) newStatus = 'confirmed';

    const updatedOrder = await Order.findByIdAndUpdate(
      normalizedOrderId,
      { orderStatus: newStatus }, 
      { new: true }               
    );

    return updatedOrder;

  } catch (error) {
    console.error('❌ Error updating order status:', error);
  }
};

module.exports = { updateOrderStatus };
