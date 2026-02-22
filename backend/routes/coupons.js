/**
 * Coupon Routes
 */

const express = require('express');
const couponController = require('../controllers/couponController');
const { verifyToken, adminOnly, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get active coupons (public)
router.get('/', couponController.getActiveCoupons);

// Validate coupon
router.post('/validate', optionalAuth, couponController.validateCoupon);

// Get coupon details
router.get('/:couponCode', couponController.getCouponDetails);

// Create coupon (admin)
router.post('/', verifyToken, adminOnly, couponController.createCoupon);

// Update coupon (admin)
router.put('/:couponId', verifyToken, adminOnly, couponController.updateCoupon);

// Delete coupon (admin)
router.delete('/:couponId', verifyToken, adminOnly, couponController.deleteCoupon);

// Get coupon stats (admin)
router.get('/:couponId/stats', verifyToken, adminOnly, couponController.getCouponStats);

module.exports = router;
