/**
 * Review Routes
 */

const express = require('express');
const reviewController = require('../controllers/reviewController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

const router = express.Router();

// Add review
router.post('/', verifyToken, validateReview, reviewController.addReview);

// Get product reviews
router.get('/product/:productId', optionalAuth, reviewController.getReviews);

// Get my reviews
router.get('/my-reviews', verifyToken, reviewController.getMyReviews);

// Update review
router.put('/:reviewId', verifyToken, reviewController.updateReview);

// Delete review
router.delete('/:reviewId', verifyToken, reviewController.deleteReview);

// Vote on review
router.post('/:reviewId/vote', verifyToken, reviewController.voteHelpful);

module.exports = router;
