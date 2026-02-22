/**
 * Admin Routes
 */

const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Dashboard
router.get('/dashboard', verifyToken, adminOnly, adminController.getDashboard);

// Orders management
router.get('/orders', verifyToken, adminOnly, adminController.getOrdersManagement);

// Products management
router.get('/products', verifyToken, adminOnly, adminController.getProductsManagement);

// Users management
router.get('/users', verifyToken, adminOnly, adminController.getUsersManagement);

// Reviews management
router.get('/reviews', verifyToken, adminOnly, adminController.getReviewsManagement);

// Moderate review
router.put('/reviews/:reviewId', verifyToken, adminOnly, adminController.moderateReview);

module.exports = router;
