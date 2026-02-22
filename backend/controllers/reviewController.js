/**
 * Review Controller
 * Product reviews and ratings
 */

const Review = require('../models/Review');
const Order = require('../models/Order');

/**
 * Add review for product
 * POST /api/reviews
 */
exports.addReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId, orderId, rating, title, comment, images } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    // Validation
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product, rating, and comment are required',
        errors: ['productId', 'rating', 'comment']
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
        errors: ['rating']
      });
    }

    if (comment.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be at least 10 characters',
        errors: ['comment']
      });
    }

    // Check if user can review
    const canReview = await Review.canReview(userId, productId);
    if (!canReview.canReview) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review this product',
        errors: [canReview.reason]
      });
    }

    // Create review
    const review = new Review({
      product: productId,
      user: userId,
      order: orderId || canReview.orderId,
      rating,
      title: title || '',
      comment,
      images: images || [],
      isVerifiedPurchase: !!canReview.orderId
    });

    await review.save();
    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      errors: [err.message]
    });
  }
};

/**
 * Get reviews for product
 * GET /api/reviews/product/:productId
 */
exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = '-helpfulVotes.up' } = req.query;

    const reviews = await Review.getProductReviews(productId, {
      page: parseInt(page),
      limit: parseInt(limit),
      rating: rating ? parseInt(rating) : null,
      sort
    });

    const total = await Review.countDocuments({
      product: productId,
      isApproved: true
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      errors: [err.message]
    });
  }
};

/**
 * Get user's reviews
 * GET /api/reviews/my-reviews
 */
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('product', 'name styleNo images')
      .populate('adminReply.repliedBy', 'name');

    const total = await Review.countDocuments({ user: userId });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get my reviews error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      errors: [err.message]
    });
  }
};

/**
 * Update review
 * PUT /api/reviews/:reviewId
 */
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        errors: ['notFound']
      });
    }

    // Check authorization
    if (!review.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['auth']
      });
    }

    // Check if review is old (can't edit after 30 days)
    const daysSinceReview = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReview > 30) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be edited within 30 days of creation',
        errors: ['age']
      });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      errors: [err.message]
    });
  }
};

/**
 * Delete review
 * DELETE /api/reviews/:reviewId
 */
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        errors: ['notFound']
      });
    }

    // Check authorization
    if (!review.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['auth']
      });
    }

    await Review.deleteOne({ _id: reviewId });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      errors: [err.message]
    });
  }
};

/**
 * Vote on review helpfulness
 * POST /api/reviews/:reviewId/vote
 */
exports.voteHelpful = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    const { vote } = req.body; // 'up' or 'down'

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    if (!vote || !['up', 'down'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be "up" or "down"',
        errors: ['vote']
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        errors: ['notFound']
      });
    }

    await review.vote(userId, vote);

    res.json({
      success: true,
      message: 'Vote recorded',
      data: {
        helpfulVotes: review.helpfulVotes
      }
    });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({
      success: false,
      message: 'Error recording vote',
      errors: [err.message]
    });
  }
};

module.exports = exports;
