/**
 * Coupon Controller
 * Coupon validation and management
 */

const Coupon = require('../models/Coupon');

/**
 * Get all active coupons
 * GET /api/coupons
 */
exports.getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.getActiveCoupons()
      .select('-usageCount.byUser -createdBy')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: coupons
    });
  } catch (err) {
    console.error('Get coupons error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons',
      errors: [err.message]
    });
  }
};

/**
 * Validate coupon code
 * POST /api/coupons/validate
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;
    const userId = req.user?.id;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
        errors: ['couponCode']
      });
    }

    if (!cartTotal) {
      return res.status(400).json({
        success: false,
        message: 'Cart total is required',
        errors: ['cartTotal']
      });
    }

    // Find coupon
    const coupon = await Coupon.findValidByCode(couponCode);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code',
        errors: ['couponCode']
      });
    }

    // Mock cart for validation
    const mockCart = { subtotal: cartTotal };

    // Check if applicable
    const check = coupon.isApplicable(mockCart, userId);

    if (!check.valid && check.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Coupon cannot be applied',
        errors: check.errors
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(mockCart);

    // Check first-time user if needed
    if (coupon.firstTimeOnly && userId) {
      const Order = require('../models/Order');
      const userOrderCount = await Order.countDocuments({ user: userId });
      if (userOrderCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only for first-time customers',
          errors: ['firstTimeOnly']
        });
      }
    }

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description
        },
        discount: Math.round(discount * 100) / 100,
        finalTotal: Math.max(0, cartTotal - discount)
      }
    });
  } catch (err) {
    console.error('Validate coupon error:', err);
    res.status(500).json({
      success: false,
      message: 'Error validating coupon',
      errors: [err.message]
    });
  }
};

/**
 * Get coupon details
 * GET /api/coupons/:couponCode
 */
exports.getCouponDetails = async (req, res) => {
  try {
    const { couponCode } = req.params;

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase()
    }).select('-usageCount.byUser -createdBy');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
        errors: ['notFound']
      });
    }

    res.json({
      success: true,
      data: coupon
    });
  } catch (err) {
    console.error('Get coupon details error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupon',
      errors: [err.message]
    });
  }
};

/**
 * Create coupon (admin only)
 * POST /api/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create coupons',
        errors: ['auth']
      });
    }

    const {
      code,
      description,
      type,
      value,
      maxDiscount,
      minOrderValue,
      usageLimit,
      validFrom,
      validUntil,
      firstTimeOnly,
      applicability
    } = req.body;

    // Validation
    if (!code || !type || !value || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Code, type, value, and validity dates are required',
        errors: ['code', 'type', 'value', 'validFrom', 'validUntil']
      });
    }

    // Check if code exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Coupon code already exists',
        errors: ['code']
      });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      type,
      value,
      maxDiscount: maxDiscount || 0,
      minOrderValue: minOrderValue || 0,
      usageLimit: usageLimit || { total: 0, perUser: 1 },
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      firstTimeOnly: firstTimeOnly || false,
      applicability: applicability || { type: 'all' },
      createdBy: userId
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (err) {
    console.error('Create coupon error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating coupon',
      errors: [err.message]
    });
  }
};

/**
 * Update coupon (admin only)
 * PUT /api/coupons/:couponId
 */
exports.updateCoupon = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update coupons',
        errors: ['auth']
      });
    }

    const { couponId } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findByIdAndUpdate(couponId, updates, {
      new: true,
      runValidators: true
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
        errors: ['notFound']
      });
    }

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (err) {
    console.error('Update coupon error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating coupon',
      errors: [err.message]
    });
  }
};

/**
 * Delete coupon (admin only)
 * DELETE /api/coupons/:couponId
 */
exports.deleteCoupon = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete coupons',
        errors: ['auth']
      });
    }

    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
        errors: ['notFound']
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (err) {
    console.error('Delete coupon error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting coupon',
      errors: [err.message]
    });
  }
};

/**
 * Get coupon statistics (admin only)
 * GET /api/coupons/:couponId/stats
 */
exports.getCouponStats = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view stats',
        errors: ['auth']
      });
    }

    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
        errors: ['notFound']
      });
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        totalUsage: coupon.usageCount.total,
        usageLimit: coupon.usageLimit.total,
        perUserLimit: coupon.usageLimit.perUser,
        usageRate: coupon.usageLimit.total > 0 
          ? ((coupon.usageCount.total / coupon.usageLimit.total) * 100).toFixed(2) + '%'
          : 'Unlimited',
        uniqueUsers: coupon.usageCount.byUser.length
      }
    });
  } catch (err) {
    console.error('Get coupon stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      errors: [err.message]
    });
  }
};

module.exports = exports;
