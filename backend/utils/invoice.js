/**
 * Invoice Generation Utility
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate invoice PDF
 */
exports.generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      // Create invoices directory if not exists
      const invoiceDir = path.join(__dirname, '../invoices');
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      const filename = `invoice-${order.orderId}.pdf`;
      const filepath = path.join(invoiceDir, filename);
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).text('STYLO7', 50, 50);
      doc.fontSize(10).text('Men\'s Bottom Wear', 50, 75);
      doc.text('Address: 448 Sai Paradise Colony, Indore – 452012, MP', 50, 90);
      doc.text('Contact: +91-7974808989 | stylo7india@gmail.com', 50, 105);

      // Invoice title
      doc.fontSize(16).text('INVOICE', 400, 50);
      doc.fontSize(10);
      doc.text(`Order ID: ${order.orderId}`, 400, 75);
      doc.text(`Date: ${order.createdAt.toLocaleDateString()}`, 400, 90);
      doc.text(`Status: ${order.orderStatus}`, 400, 105);

      // Shipping address
      doc.fontSize(12).text('Shipping Address', 50, 140);
      doc.fontSize(10);
      doc.text(order.shippingAddress.fullName, 50, 160);
      doc.text(order.shippingAddress.addressLine1, 50, 175);
      if (order.shippingAddress.addressLine2) {
        doc.text(order.shippingAddress.addressLine2, 50, 190);
      }
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 50, 205);
      doc.text(`Phone: ${order.shippingAddress.phone}`, 50, 220);

      // Items table
      const tableTop = 260;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Size', 150, tableTop);
      doc.text('Qty', 200, tableTop);
      doc.text('Price', 250, tableTop);
      doc.text('Total', 350, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      doc.font('Helvetica');
      let yPosition = tableTop + 25;

      for (const item of order.items) {
        doc.text(item.name, 50, yPosition, { width: 100, ellipsis: true });
        doc.text(item.size, 150, yPosition);
        doc.text(item.quantity.toString(), 200, yPosition);
        doc.text(`₹${item.price}`, 250, yPosition);
        doc.text(`₹${item.total}`, 350, yPosition);
        yPosition += 25;
      }

      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 15;

      // Totals
      doc.text('Subtotal:', 300, yPosition);
      doc.text(`₹${order.billing.subtotal}`, 450, yPosition);
      yPosition += 20;

      doc.text('Discount:', 300, yPosition);
      doc.text(`₹${order.billing.totalDiscount}`, 450, yPosition);
      yPosition += 20;

      if (order.billing.couponDiscount > 0) {
        doc.text('Coupon Discount:', 300, yPosition);
        doc.text(`₹${order.billing.couponDiscount}`, 450, yPosition);
        yPosition += 20;
      }

      doc.text('Shipping:', 300, yPosition);
      doc.text(`₹${order.billing.shippingCharge}`, 450, yPosition);
      yPosition += 20;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Grand Total:', 300, yPosition);
      doc.text(`₹${order.billing.grandTotal}`, 450, yPosition);

      // Payment info
      yPosition += 50;
      doc.fontSize(10).font('Helvetica-Bold').text('Payment Details', 50, yPosition);
      yPosition += 15;
      doc.font('Helvetica');
      doc.text(`Method: ${order.payment.method}`, 50, yPosition);
      yPosition += 15;
      doc.text(`Status: ${order.payment.status}`, 50, yPosition);

      // Footer
      doc.fontSize(9).text('Thank you for your order!', 50, 700, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(filepath));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = exports;
