/**
 * Email Service Utilities
 */

const nodemailer = require('nodemailer');

// Configure email transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email
 * @param {Object} options - { to, subject, template, data }
 */
exports.sendEmail = async (options) => {
  const { to, subject, template, data = {} } = options;

  try {
    // Template mapping
    const templates = {
      welcome: getWelcomeTemplate(data),
      'order-confirmation': getOrderConfirmationTemplate(data),
      'payment-confirmation': getPaymentConfirmationTemplate(data),
      'reset-password': getResetPasswordTemplate(data),
      'refund-confirmation': getRefundTemplate(data)
    };

    const html = templates[template] || '';

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'STYLO7 <noreply@stylo7.com>',
      to,
      subject,
      html
    });

    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
};

/**
 * Email Templates
 */

function getWelcomeTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome to STYLO7!</h1>
      <p>Hello ${data.name},</p>
      <p>Thank you for joining STYLO7. We're excited to have you!</p>
      <p>You can now browse our collection of premium men's bottom wear and enjoy exclusive deals.</p>
      <a href="${process.env.FRONTEND_URL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Start Shopping</a>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">STYLO7 Team</p>
    </div>
  `;
}

function getOrderConfirmationTemplate(data) {
  const order = data.order;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Order Confirmed!</h1>
      <p>Thank you for your order!</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Total:</strong> ₹${order.billing.grandTotal}</p>
        <p><strong>Status:</strong> ${order.orderStatus}</p>
      </div>
      <h3>Order Items:</h3>
      <ul>
        ${order.items.map(item => `
          <li>${item.name} (${item.quantity}x) - ₹${item.total}</li>
        `).join('')}
      </ul>
      <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Order</a>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">STYLO7 Team</p>
    </div>
  `;
}

function getPaymentConfirmationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #28a745;">Payment Successful!</h1>
      <p>Your payment has been received and confirmed.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Order ID:</strong> ${data.order.orderId}</p>
        <p><strong>Amount Paid:</strong> ₹${data.order.billing.grandTotal}</p>
        <p><strong>Payment Status:</strong> Confirmed</p>
      </div>
      <p>Your order will be processed and shipped soon. You'll receive tracking updates via email.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">STYLO7 Team</p>
    </div>
  `;
}

function getResetPasswordTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Reset Your Password</h1>
      <p>Hello ${data.name},</p>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${data.resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      <p style="color: #999; font-size: 12px;">This link expires in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">STYLO7 Team</p>
    </div>
  `;
}

function getRefundTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #28a745;">Refund Processed</h1>
      <p>Your refund has been initiated.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Order ID:</strong> ${data.order.orderId}</p>
        <p><strong>Refund Amount:</strong> ₹${data.refundAmount}</p>
        <p><strong>Status:</strong> Processing</p>
      </div>
      <p>The refund will be credited to your original payment method within 5-7 business days.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">STYLO7 Team</p>
    </div>
  `;
}

module.exports = exports;
