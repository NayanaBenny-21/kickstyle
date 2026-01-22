const PDFDocument = require("pdfkit");

exports.generateSalesPdf = (orders, summary, res) => {
  try {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 40, left: 20, right: 20, bottom: 40 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf"
    );

    doc.pipe(res);

    /* ================= PAGE CONSTANTS ================= */
    const PAGE_WIDTH = doc.page.width;
    const MARGIN_X = doc.page.margins.left;
    const USABLE_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

    const ROW_HEIGHT = 20;
    const CELL_PADDING = 4;
    const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom;

    /* ================= COLUMNS ================= */
    const headers = [
      "Order ID",
      "Customer",
      "Order Date",
      "Total",
      "Delivery",
      "Platform",
      "Discount",
      "Refund",
      "Net",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ];

    // Relative column sizes (will auto-scale)
    const baseWidths = [
      1.4,  // Order ID
      1.6,  // Customer
      1.2,  // Date
      1.0,  // Total
      1.0,  // Delivery
      1.0,  // Platform
      1.0,  // Discount
      1.0,  // Refund
      1.1,  // Net
      1.3,  // Payment
      1.2,  // Pay Status
      1.4,  // Order Status
    ];

    const totalUnits = baseWidths.reduce((a, b) => a + b, 0);
    const colWidths = baseWidths.map(
      (w) => (w / totalUnits) * USABLE_WIDTH
    );

    let y = doc.y;

    /* ================= TITLE ================= */
    doc.font("Helvetica-Bold").fontSize(14).text("Sales Report", {
      align: "center",
    });

    y = doc.y + 20;

    /* ================= DRAW ROW ================= */
    const drawRow = (row, isHeader = false) => {
      let x = MARGIN_X;

      row.forEach((cell, i) => {
        doc.rect(x, y, colWidths[i], ROW_HEIGHT).stroke();

        const isNumber = i >= 3 && i <= 8;

        doc
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .fontSize(isHeader ? 8 : 7)
          .text(String(cell), x + CELL_PADDING, y + 6, {
            width: colWidths[i] - CELL_PADDING * 2,
            align: isNumber ? "right" : "left",
            ellipsis: true,
          });

        x += colWidths[i];
      });

      y += ROW_HEIGHT;
    };

    /* ================= HEADER ================= */
    drawRow(headers, true);

    /* ================= DATA ================= */
    orders.forEach((o) => {
      if (y + ROW_HEIGHT > PAGE_BOTTOM) {
        doc.addPage();
        y = doc.y;
        drawRow(headers, true);
      }

      drawRow([
        o.orderId,
        o.user_id?.name || "N/A",
        new Date(o.orderDate).toLocaleDateString("en-IN"),
        o.totalPrice?.toFixed(2) || "0.00",
        o.deliveryCharge?.toFixed(2) || "0.00",
        o.platformFee?.toFixed(2) || "0.00",
        o.couponDiscount?.toFixed(2) || "0.00",
        o.refund?.toFixed(2) || "0.00",
        o.netAmount?.toFixed(2) || "0.00",
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
      ]);
    });

    /* ================= SUMMARY TABLE ================= */
    y += 30;

    doc.font("Helvetica-Bold").fontSize(11).text("Summary", MARGIN_X, y);
    y += 15;

    const summaryHeaders = [
      "Orders",
      "Sales",
      "Delivery",
      "Platform",
      "Discount",
      "Refunds",
      "Net Revenue",
    ];

    const summaryValues = [
      summary.count,
      `₹${summary.sales.toFixed(2)}`,
      `₹${summary.delivery.toFixed(2)}`,
      `₹${summary.platformFee.toFixed(2)}`,
      `₹${summary.discount.toFixed(2)}`,
      `₹${summary.refunds.toFixed(2)}`,
      `₹${summary.net.toFixed(2)}`,
    ];

    const summaryColWidth = USABLE_WIDTH / summaryHeaders.length;

    const drawSummaryRow = (row, isHeader = false) => {
      let x = MARGIN_X;

      row.forEach((cell) => {
        doc.rect(x, y, summaryColWidth, ROW_HEIGHT).stroke();

        doc
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .fontSize(9)
          .text(String(cell), x + 5, y + 6, {
            width: summaryColWidth - 10,
            align: "center",
          });

        x += summaryColWidth;
      });

      y += ROW_HEIGHT;
    };

    drawSummaryRow(summaryHeaders, true);
    drawSummaryRow(summaryValues);

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  }
};
