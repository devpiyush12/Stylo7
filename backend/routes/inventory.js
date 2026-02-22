/**
 * Inventory Routes
 */

const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Check stock (public)
router.get('/check/:productId/:variantId', inventoryController.checkStock);

// Get inventory history
router.get('/:productId/history', verifyToken, adminOnly, inventoryController.getInventoryHistory);

// Get inventory summary
router.get('/:productId/summary', verifyToken, adminOnly, inventoryController.getInventorySummary);

// Get low stock products (admin)
router.get('/low-stock', verifyToken, adminOnly, inventoryController.getLowStockProducts);

// Update stock (admin)
router.put('/:productId/:variantId', verifyToken, adminOnly, inventoryController.updateStock);

// Get value report (admin)
router.get('/reports/value', verifyToken, adminOnly, inventoryController.getValueReport);

module.exports = router;
