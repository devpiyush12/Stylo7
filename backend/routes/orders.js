/**
 * Order Routes
 */

const express = require('express');
const orderController = require('../controllers/orderController');
const { verifyToken, optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Create order
router.post('/', optionalAuth, orderController.createOrder);

// Get user orders
router.get('/', verifyToken, orderController.getOrders);

// Get order by ID
router.get('/:orderId', optionalAuth, orderController.getOrderById);

// Cancel order
router.put('/:orderId/cancel', verifyToken, orderController.cancelOrder);

// Update order status (admin)
router.put('/:orderId/status', verifyToken, adminOnly, orderController.updateOrderStatus);

// Generate invoice
router.get('/:orderId/invoice', verifyToken, orderController.generateInvoice);

module.exports = router;
