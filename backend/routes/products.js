/**
 * Product Routes
 */

const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Get all products
router.get('/', productController.getProducts);

// Search products
router.get('/search', productController.searchProducts);

// Get featured products
router.get('/featured', productController.getFeatured);

// Get product by ID
router.get('/:id', productController.getProductById);

// Get variants
router.get('/:id/variants', productController.getVariants);

// Get reviews
router.get('/:id/reviews', productController.getProductReviews);

// Get related products
router.get('/:id/related', productController.getRelatedProducts);

module.exports = router;
