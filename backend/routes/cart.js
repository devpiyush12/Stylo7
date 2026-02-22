/**
 * Cart Routes
 */

const express = require('express');
const cartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get cart
router.get('/', optionalAuth, cartController.getCart);

// Add item to cart
router.post('/add', optionalAuth, cartController.addItem);

// Update quantity
router.put('/items/:itemId', optionalAuth, cartController.updateQuantity);

// Remove item
router.delete('/items/:itemId', optionalAuth, cartController.removeItem);

// Apply coupon
router.post('/coupon/apply', optionalAuth, cartController.applyCoupon);

// Remove coupon
router.delete('/coupon', optionalAuth, cartController.removeCoupon);

// Clear cart
router.delete('/', optionalAuth, cartController.clearCart);

module.exports = router;
