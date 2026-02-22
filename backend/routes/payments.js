/**
 * Payment Routes
 */

const express = require('express');
const paymentController = require('../controllers/paymentController');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Initiate payment
router.post('/razorpay/initiate', verifyToken, paymentController.initiateRazorpayPayment);

// Verify payment
router.post('/razorpay/verify', verifyToken, paymentController.verifyRazorpayPayment);

// Payment webhook (public, secured by signature)
router.post('/webhook', paymentController.processWebhook);

// Process refund (admin)
router.post('/:orderId/refund', verifyToken, adminOnly, paymentController.processRefund);

module.exports = router;
