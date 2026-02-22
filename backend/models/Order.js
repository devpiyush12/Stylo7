/**
 * Order Model
 * Complete order management with payment, tracking, and status
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  styleNo: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  mrp: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gst: { type: Number, default: 5 },
  gstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true }
}, { _id: false });

const billingSchema = new mongoose.Schema({
  subtotal: { type: Number, required: true },
  totalMRP: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  gstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['razorpay', 'cod', 'upi', 'netbanking', 'wallet'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paidAt: Date,
  refundId: String,
  refundedAt: Date
}, { _id: false });

const trackingHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: String
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  guestEmail: String,
  guestPhone: String,
  items: [orderItemSchema],
  shippingAddress: { type: shippingAddressSchema, required: true },
  billing: { type: billingSchema, required: true },
  payment: { type: paymentSchema, required: true },
  orderStatus: {
    type: String,
    enum: [
      'placed', 'confirmed', 'processing', 'packed',
      'shipped', 'out_for_delivery', 'delivered',
      'cancelled', 'return_requested', 'return_picked',
      'refund_initiated', 'refunded'
    ],
    default: 'placed',
    index: true
  },
  tracking: {
    courier: String,
    trackingId: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    history: [trackingHistorySchema]
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  notes: String,
  adminNotes: String,
  invoiceUrl: String,
  isWholesale: { type: Boolean, default: false },
  cancelledAt: Date,
  cancellationReason: String,
  deliveredAt: Date
}, { timestamps: true });

// Indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// Generate order ID
orderSchema.pre('validate', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.models.Order.countDocuments();
    const year = new Date().getFullYear();
    this.orderId = `STY-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Add tracking history
orderSchema.methods.addTrackingEvent = function(status, message, location = '') {
  this.tracking.history.push({ status, message, location });
  this.orderStatus = status;
  return this.save();
};

// Calculate totals
orderSchema.methods.calculateTotals = function() {
  const itemsTotal = this.items.reduce((sum, item) => sum + item.total, 0);
  const totalMRP = this.items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
  const totalDiscount = totalMRP - itemsTotal;
  
  this.billing.subtotal = itemsTotal;
  this.billing.totalMRP = totalMRP;
  this.billing.totalDiscount = totalDiscount;
  this.billing.grandTotal = itemsTotal + this.billing.shippingCharge - this.billing.couponDiscount;
  
  return this;
};

// Static methods
orderSchema.statics.getByUser = function(userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const filter = { user: userId };
  if (status) filter.orderStatus = status;
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('items.product', 'name images styleNo');
};

orderSchema.statics.getStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$billing.grandTotal' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$billing.grandTotal' }
      }
    }
  ]);
  return stats[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
};

module.exports = mongoose.model('Order', orderSchema);
