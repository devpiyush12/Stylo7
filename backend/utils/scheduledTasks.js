/**
 * STYLO7 Scheduled Tasks
 * Cron jobs for maintenance tasks
 */

const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Check for low stock products and log alerts
 * Runs daily at midnight
 */
const checkLowStock = async () => {
  try {
    const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;
    
    const lowStockProducts = await Product.find({
      $expr: { $lte: [{ $sum: '$variants.stock' }, lowStockThreshold] },
      isActive: true
    });

    if (lowStockProducts.length > 0) {
      console.log(`[LOW STOCK ALERT] ${lowStockProducts.length} products need restocking:`);
      lowStockProducts.forEach(product => {
        console.log(`  - ${product.name} (SKU: ${product.sku})`);
      });
    } else {
      console.log('[LOW STOCK CHECK] All products have sufficient stock');
    }

    return lowStockProducts;
  } catch (error) {
    console.error('[LOW STOCK CHECK ERROR]', error.message);
    throw error;
  }
};

/**
 * Send reminders for pending orders
 * Runs daily at 9 AM
 */
const sendOrderReminders = async () => {
  try {
    // Find orders that are pending payment for more than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const pendingOrders = await Order.find({
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: { $lt: oneDayAgo }
    }).populate('user', 'email name');

    if (pendingOrders.length > 0) {
      console.log(`[ORDER REMINDERS] ${pendingOrders.length} orders need attention:`);
      pendingOrders.forEach(order => {
        console.log(`  - Order #${order.orderNumber} (${order.user?.email || 'guest'})`);
      });
    } else {
      console.log('[ORDER REMINDERS] No pending orders requiring reminders');
    }

    return pendingOrders;
  } catch (error) {
    console.error('[ORDER REMINDERS ERROR]', error.message);
    throw error;
  }
};

module.exports = {
  checkLowStock,
  sendOrderReminders
};
