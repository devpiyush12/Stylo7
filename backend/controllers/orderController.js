/**
 * Order Controller
 * Order management and tracking
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { generateInvoice } = require('../utils/invoice');
const { sendEmail } = require('../utils/email');

/**
 * Create order from cart
 * POST /api/orders
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { shippingAddress, paymentMethod, guestEmail, guestPhone } = req.body;

    // Validation
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and payment method are required',
        errors: ['shippingAddress', 'paymentMethod']
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
        errors: ['cart']
      });
    }

    // Check stock
    for (const item of cart.items) {
      const variant = item.product.variants.find(v => v._id.equals(item.variant));
      if (!variant || variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.product.name} is out of stock`,
          errors: ['stock']
        });
      }
    }

    // Create order
    const order = new Order({
      user: userId,
      guestEmail,
      guestPhone,
      items: cart.items,
      shippingAddress,
      billing: {
        subtotal: cart.subtotal,
        totalMRP: cart.totalMRP,
        totalDiscount: cart.totalDiscount,
        couponDiscount: cart.couponDiscount,
        shippingCharge: cart.shippingCharge,
        grandTotal: cart.grandTotal
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending'
      },
      coupon: cart.coupon
    });

    await order.save();

    // Deduct stock
    for (const item of cart.items) {
      const product = item.product;
      const variant = product.variants.find(v => v._id.equals(item.variant));
      
      variant.stock -= item.quantity;
      await product.save();

      // Log inventory change
      await InventoryLog.logOrderDeduction(product, variant, item.quantity, order._id, userId);
    }

    // Clear cart
    await Cart.deleteOne({ _id: cart._id });

    // Increment coupon usage
    if (order.coupon) {
      const coupon = await Coupon.findById(order.coupon);
      if (coupon) {
        await coupon.incrementUsage(userId);
      }
    }

    // Send confirmation email
    try {
      await sendEmail({
        to: order.user?.email || guestEmail,
        subject: `Order Confirmed - ${order.orderId}`,
        template: 'order-confirmation',
        data: { order: order.toObject() }
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      errors: [err.message]
    });
  }
};

/**
 * Get orders for user
 * GET /api/orders
 */
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const orders = await Order.getByUser(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    const total = await Order.countDocuments({
      user: userId,
      ...(status && { orderStatus: status })
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      errors: [err.message]
    });
  }
};

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images styleNo')
      .populate('coupon', 'code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: ['notFound']
      });
    }

    // Check authorization (user can only see own orders)
    if (order.user && !order.user._id.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['auth']
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      errors: [err.message]
    });
  }
};

/**
 * Cancel order
 * PUT /api/orders/:orderId/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const order = await Order.findById(orderId).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: ['notFound']
      });
    }

    // Check authorization
    if (!order.user?.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['auth']
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['placed', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in current status',
        errors: ['status']
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = item.product;
      const variant = product.variants.find(v => v.sku === item.sku);
      
      if (variant) {
        variant.stock += item.quantity;
        await product.save();

        await InventoryLog.logStockRestore(product, variant, item.quantity, order._id, userId);
      }
    }

    // Update order
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason || 'User requested cancellation';
    order.cancelledAt = new Date();
    
    // Process refund if payment was made
    if (order.payment.status === 'paid') {
      order.payment.status = 'refunded';
      order.payment.refundedAt = new Date();
      // Refund logic would go here
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      errors: [err.message]
    });
  }
};

/**
 * Update order status (admin only)
 * PUT /api/orders/:orderId/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;

    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update order status',
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

    const validStatuses = [
      'placed', 'confirmed', 'processing', 'packed',
      'shipped', 'out_for_delivery', 'delivered',
      'cancelled', 'return_requested', 'return_picked',
      'refund_initiated', 'refunded'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        errors: ['status']
      });
    }

    await order.addTrackingEvent(status, notes || `Order ${status}`, 'Processing');
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      errors: [err.message]
    });
  }
};

/**
 * Generate invoice
 * GET /api/orders/:orderId/invoice
 */
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name styleNo');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errors: ['notFound']
      });
    }

    // Check authorization
    if (!order.user?.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['auth']
      });
    }

    const pdfPath = await generateInvoice(order);

    res.download(pdfPath, `invoice-${order.orderId}.pdf`);
  } catch (err) {
    console.error('Generate invoice error:', err);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      errors: [err.message]
    });
  }
};

module.exports = exports;
