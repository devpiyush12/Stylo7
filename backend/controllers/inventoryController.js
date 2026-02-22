/**
 * Inventory Controller
 * Stock management and inventory tracking
 */

const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

/**
 * Check stock for product variant
 * GET /api/inventory/check/:productId/:variantId
 */
exports.checkStock = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { quantity = 1 } = req.query;

    const product = await Product.findById(productId).select('variants name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['notFound']
      });
    }

    const variant = product.variants.find(v => v._id.equals(variantId));

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
        errors: ['notFound']
      });
    }

    const available = variant.stock >= quantity;

    res.json({
      success: true,
      data: {
        available,
        stock: variant.stock,
        requested: parseInt(quantity),
        message: available 
          ? `${variant.stock} items in stock`
          : `Only ${variant.stock} items available`
      }
    });
  } catch (err) {
    console.error('Check stock error:', err);
    res.status(500).json({
      success: false,
      message: 'Error checking stock',
      errors: [err.message]
    });
  }
};

/**
 * Get inventory history for product
 * GET /api/inventory/:productId/history
 */
exports.getInventoryHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20, variantId, type } = req.query;

    const history = await InventoryLog.getProductHistory(productId, {
      page: parseInt(page),
      limit: parseInt(limit),
      variantId,
      type
    });

    const total = await InventoryLog.countDocuments({
      product: productId,
      ...(variantId && { variant: variantId }),
      ...(type && { type })
    });

    res.json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory history',
      errors: [err.message]
    });
  }
};

/**
 * Get low stock products
 * GET /api/inventory/low-stock
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const lowStockThreshold = 5; // From business rules

    const products = await Product.find({
      'variants.stock': { $lte: lowStockThreshold }
    })
      .select('name styleNo variants')
      .limit(parseInt(limit));

    const lowStockVariants = products.map(product => ({
      product: {
        id: product._id,
        name: product.name,
        styleNo: product.styleNo
      },
      variants: product.variants.filter(v => v.stock <= lowStockThreshold)
    })).filter(item => item.variants.length > 0);

    res.json({
      success: true,
      data: lowStockVariants,
      threshold: lowStockThreshold
    });
  } catch (err) {
    console.error('Get low stock error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      errors: [err.message]
    });
  }
};

/**
 * Get inventory summary for product
 * GET /api/inventory/:productId/summary
 */
exports.getInventorySummary = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    const product = await Product.findById(productId).select('name variants');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['notFound']
      });
    }

    // Calculate total stock
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

    // Get summary by type
    const summary = await InventoryLog.getSummary(
      productId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.name
        },
        currentStock: totalStock,
        variants: product.variants.map(v => ({
          id: v._id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: v.stock
        })),
        summary
      }
    });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary',
      errors: [err.message]
    });
  }
};

/**
 * Update stock (admin only)
 * PUT /api/inventory/:productId/:variantId
 */
exports.updateStock = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update stock',
        errors: ['auth']
      });
    }

    const { productId, variantId } = req.params;
    const { quantity, type, notes } = req.body;
    const userId = req.user?.id;

    if (quantity === undefined || !type) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and type are required',
        errors: ['quantity', 'type']
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['notFound']
      });
    }

    const variant = product.variants.find(v => v._id.equals(variantId));

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
        errors: ['notFound']
      });
    }

    const previousStock = variant.stock;
    variant.stock = Math.max(0, variant.stock + quantity);

    await product.save();

    // Log the change
    const log = await InventoryLog.logChange({
      product: product._id,
      variant: variant._id,
      sku: variant.sku,
      change: quantity,
      previousStock,
      newStock: variant.stock,
      type,
      notes,
      changedBy: userId,
      lowStockAlert: variant.stock <= 5
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        variant: {
          id: variant._id,
          sku: variant.sku,
          previousStock,
          newStock: variant.stock
        },
        log
      }
    });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      errors: [err.message]
    });
  }
};

/**
 * Get inventory value report (admin only)
 * GET /api/inventory/reports/value
 */
exports.getValueReport = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view reports',
        errors: ['auth']
      });
    }

    const report = await InventoryLog.getValueReport();

    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('Get value report error:', err);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      errors: [err.message]
    });
  }
};

module.exports = exports;
