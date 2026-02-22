/**
 * Payment Controller
 * Payment processing with Razorpay
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { sendEmail } = require('../utils/email');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Initiate Razorpay payment
 * POST /api/payments/razorpay/initiate
 */
exports.initiateRazorpayPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const userId = req.user?.id;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required',
        errors: ['orderId', 'amount']
      });
    }

    // Get order
    const order = await Order.findById(orderId).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: ['notFound']
      });
    }

    // Check authorization
    if (order.user && !order.user._id.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['auth']
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: order.orderId,
      notes: {
        orderId: order._id.toString(),
        userId: order.user?._id?.toString() || 'guest'
      }
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: amount,
        orderId: order._id,
        customer: {
          name: order.shippingAddress.fullName,
          email: order.user?.email || order.guestEmail,
          contact: order.user?.phone || order.guestPhone
        },
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (err) {
    console.error('Initiate payment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error initiating payment',
      errors: [err.message]
    });
  }
};

/**
 * Verify Razorpay payment
 * POST /api/payments/razorpay/verify
 */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId
    } = req.body;

    const userId = req.user?.id;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment details are required',
        errors: ['razorpay']
      });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = hmac.digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        errors: ['signature']
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured',
        errors: ['payment']
      });
    }

    // Update order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: ['notFound']
      });
    }

    // Check authorization
    if (order.user && !order.user._id.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['auth']
      });
    }

    order.payment.razorpayOrderId = razorpayOrderId;
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpaySignature = razorpaySignature;
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    order.orderStatus = 'confirmed';

    await order.save();

    // Send payment confirmation email
    try {
      await sendEmail({
        to: order.user?.email || order.guestEmail,
        subject: `Payment Confirmed - ${order.orderId}`,
        template: 'payment-confirmation',
        data: { order: order.toObject() }
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: order
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      errors: [err.message]
    });
  }
};

/**
 * Process payment webhook
 * POST /api/payments/webhook
 */
exports.processWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
    hmac.update(JSON.stringify(req.body));
    const digest = hmac.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed'
      });
    }

    switch (event) {
      case 'payment.authorized':
        // Payment authorized
        break;

      case 'payment.failed':
        // Handle failed payment
        if (payload?.payment?.notes?.orderId) {
          const order = await Order.findById(payload.payment.notes.orderId);
          if (order) {
            order.payment.status = 'failed';
            await order.save();
          }
        }
        break;

      case 'refund.created':
        // Handle refund
        if (payload?.refund?.notes?.orderId) {
          const order = await Order.findById(payload.refund.notes.orderId);
          if (order) {
            order.payment.refundId = payload.refund.id;
            order.payment.status = 'refunded';
            order.payment.refundedAt = new Date();
            await order.save();
          }
        }
        break;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      errors: [err.message]
    });
  }
};

/**
 * Process refund
 * POST /api/payments/:orderId/refund
 */
exports.processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can process refunds',
        errors: ['auth']
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: ['notFound']
      });
    }

    if (order.payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order payment is not paid',
        errors: ['payment']
      });
    }

    // Create refund
    const refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
      amount: Math.round(order.billing.grandTotal * 100),
      notes: {
        orderId: order._id.toString(),
        reason
      }
    });

    order.payment.refundId = refund.id;
    order.payment.status = 'refunded';
    order.payment.refundedAt = new Date();
    await order.save();

    // Send refund email
    try {
      await sendEmail({
        to: order.user?.email || order.guestEmail,
        subject: `Refund Processed - ${order.orderId}`,
        template: 'refund-confirmation',
        data: { order: order.toObject(), refundAmount: order.billing.grandTotal }
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        order
      }
    });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      errors: [err.message]
    });
  }
};

module.exports = exports;
