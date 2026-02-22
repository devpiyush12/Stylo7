/**
 * InventoryLog Model
 * Track inventory changes for products
 */

const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  // Stock change details
  change: {
    type: Number,
    required: true // Positive for additions, negative for reductions
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  // Change type
  type: {
    type: String,
    enum: [
      'purchase',        // Stock added from supplier
      'sale',            // Stock reduced from order
      'return',          // Stock added from return
      'adjustment',      // Manual adjustment
      'damaged',         // Stock removed due to damage
      'lost',            // Stock lost/missing
      'transfer_in',     // Transfer from another location
      'transfer_out',    // Transfer to another location
      'restock',         // Restock alert processed
      'reservation',     // Stock reserved for order
      'release',         // Reservation released
      'correction'       // Inventory correction
    ],
    required: true
  },
  // Reference to related document
  reference: {
    type: {
      type: String,
      enum: ['order', 'return', 'purchase', 'adjustment', 'transfer']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  // Order reference (if applicable)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  // Notes
  notes: String,
  // User who made the change
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Cost information
  costPrice: Number,
  totalValue: Number,
  // Low stock alert triggered?
  lowStockAlert: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes
inventoryLogSchema.index({ product: 1, variant: 1, createdAt: -1 });
inventoryLogSchema.index({ type: 1, createdAt: -1 });
inventoryLogSchema.index({ order: 1 }, { sparse: true });

// Static: Log inventory change
inventoryLogSchema.statics.logChange = async function(data) {
  const log = new this(data);
  await log.save();
  return log;
};

// Static: Get inventory history for a product
inventoryLogSchema.statics.getProductHistory = function(productId, options = {}) {
  const { page = 1, limit = 20, variantId, type } = options;
  
  const filter = { product: productId };
  if (variantId) filter.variant = variantId;
  if (type) filter.type = type;
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('changedBy', 'name')
    .populate('order', 'orderId');
};

// Static: Get inventory summary
inventoryLogSchema.statics.getSummary = async function(productId, startDate, endDate) {
  const match = { product: mongoose.Types.ObjectId(productId) };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalChange: { $sum: '$change' }
      }
    }
  ]);
  
  return summary.reduce((acc, item) => {
    acc[item._id] = { count: item.count, totalChange: item.totalChange };
    return acc;
  }, {});
};

// Static: Get low stock products
inventoryLogSchema.statics.getLowStockHistory = function(options = {}) {
  const { page = 1, limit = 20 } = options;
  
  return this.find({ lowStockAlert: true })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('product', 'name styleNo');
};

// Static: Get inventory value report
inventoryLogSchema.statics.getValueReport = async function() {
  const result = await this.aggregate([
    {
      $match: { type: { $in: ['purchase', 'sale', 'return', 'damaged'] } }
    },
    {
      $group: {
        _id: null,
        totalPurchases: {
          $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$totalValue', 0] }
        },
        totalSales: {
          $sum: { $cond: [{ $eq: ['$type', 'sale'] }, '$totalValue', 0] }
        },
        totalReturns: {
          $sum: { $cond: [{ $eq: ['$type', 'return'] }, '$totalValue', 0] }
        },
        totalDamaged: {
          $sum: { $cond: [{ $eq: ['$type', 'damaged'] }, '$totalValue', 0] }
        }
      }
    }
  ]);
  
  return result[0] || { totalPurchases: 0, totalSales: 0, totalReturns: 0, totalDamaged: 0 };
};

// Method: Create log for order stock deduction
inventoryLogSchema.statics.logOrderDeduction = async function(product, variant, quantity, orderId, changedBy) {
  return this.logChange({
    product: product._id,
    variant: variant._id,
    sku: variant.sku,
    change: -quantity,
    previousStock: variant.stock + quantity,
    newStock: variant.stock,
    type: 'sale',
    reference: { type: 'order', id: orderId },
    order: orderId,
    changedBy,
    lowStockAlert: variant.stock <= 5 // Low stock threshold
  });
};

// Method: Create log for stock restoration (cancelled order)
inventoryLogSchema.statics.logStockRestore = async function(product, variant, quantity, orderId, changedBy) {
  return this.logChange({
    product: product._id,
    variant: variant._id,
    sku: variant.sku,
    change: quantity,
    previousStock: variant.stock - quantity,
    newStock: variant.stock,
    type: 'release',
    reference: { type: 'order', id: orderId },
    order: orderId,
    changedBy
  });
};

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
