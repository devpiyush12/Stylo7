/**
 * API Routes
 * Main router setup
 */

const express = require('express');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');
const paymentRoutes = require('./payments');
const userRoutes = require('./users');
const reviewRoutes = require('./reviews');
const couponRoutes = require('./coupons');
const inventoryRoutes = require('./inventory');
const adminRoutes = require('./admin');

const router = express.Router();

// Auth routes (no auth required)
router.use('/auth', authRoutes);

// Product routes (public)
router.use('/products', productRoutes);

// Cart routes
router.use('/cart', cartRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Payment routes
router.use('/payments', paymentRoutes);

// User routes (auth required)
router.use('/users', userRoutes);

// Review routes
router.use('/reviews', reviewRoutes);

// Coupon routes
router.use('/coupons', couponRoutes);

// Inventory routes
router.use('/inventory', inventoryRoutes);

// Admin routes (admin only)
router.use('/admin', adminRoutes);

module.exports = router;
