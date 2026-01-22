const ExcelJS = require("exceljs");

exports.generateSalesExcel = async (orders, summary, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // ---------------- HEADER ----------------
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 15 },
      { header: "Customer", key: "userName", width: 20 },
      { header: "Order Date", key: "date", width: 20 },
      { header: "Total Price", key: "totalPrice", width: 15 },
      { header: "Delivery Charge", key: "delivery", width: 15 },
      { header: "Platform Fee", key: "platformFee", width: 15 },
      { header: "Coupon Discount", key: "discount", width: 18 },
      { header: "Refund", key: "refund", width: 15 },
      { header: "Net Amount", key: "net", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 15 },
      { header: "Payment Status", key: "paymentStatus", width: 15 },
      { header: "Order Status", key: "orderStatus", width: 20 },
    ];

    // ---------------- DATA ROWS ----------------
    orders.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        userName: order.user_id?.name || "N/A",
        date: order.orderDate?.toLocaleDateString("en-IN") || "",
        totalPrice: order.totalPrice?.toFixed(2) || "0.00",
        delivery: order.deliveryCharge?.toFixed(2) || "0.00",
        platformFee: order.platformFee?.toFixed(2) || "0.00",
        discount: order.couponDiscount?.toFixed(2) || "0.00",
        refund: order.refund?.toFixed(2) || "0.00",
        net: order.netAmount?.toFixed(2) || "0.00",
        paymentMethod: order.paymentMethod || "N/A",
        paymentStatus: order.paymentStatus || "N/A",
        orderStatus: order.orderStatus || "N/A",
      });
    });

    // ---------------- SUMMARY ROW ----------------
    worksheet.addRow([]); // empty row
    worksheet.addRow([
      "", "", "Total Orders", summary.count,
      "Total Delivery", summary.delivery?.toFixed(2) || "0.00",
      "Total Platform Fee", summary.platformFee?.toFixed(2) || "0.00",
      "Total Discount", summary.discount?.toFixed(2) || "0.00",
      "Total Refunds", summary.refunds?.toFixed(2) || "0.00",
      "Net Revenue", summary.net?.toFixed(2) || "0.00",
    ]);

    // ---------------- SEND EXCEL ----------------
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel generation error:", err);
    res.status(500).send("Error generating Excel");
  }
};
