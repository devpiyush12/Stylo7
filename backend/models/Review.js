/**
 * Review Model
 * Product reviews and ratings with verification
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  title: {
    type: String,
    maxlength: 100,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  images: [{
    url: String,
    publicId: String
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve, can be moderated
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 }
  },
  votedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['up', 'down']
    }
  }],
  adminReply: {
    message: String,
    repliedAt: Date,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, { timestamps: true });

// Compound index - one review per product per user
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Index for filtering
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isApproved: 1, createdAt: -1 });
reviewSchema.index({ product: 1, isApproved: 1, rating: -1 });

// Static: Get reviews for a product
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const { page = 1, limit = 10, rating, sort = '-createdAt' } = options;
  
  const filter = { product: productId, isApproved: true };
  if (rating) filter.rating = rating;
  
  return this.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name')
    .select('-votedBy');
};

// Static: Get rating summary for a product
reviewSchema.statics.getRatingSummary = async function(productId) {
  const summary = await this.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    average: 0,
    total: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
  
  let totalRating = 0;
  for (const item of summary) {
    result.breakdown[item._id] = item.count;
    result.total += item.count;
    totalRating += item._id * item.count;
  }
  
  if (result.total > 0) {
    result.average = (totalRating / result.total).toFixed(1);
  }
  
  return result;
};

// Static: Check if user can review product
reviewSchema.statics.canReview = async function(userId, productId) {
  // Check if already reviewed
  const existing = await this.findOne({ user: userId, product: productId });
  if (existing) return { canReview: false, reason: 'already_reviewed' };
  
  // Check if user has purchased the product
  const Order = mongoose.model('Order');
  const order = await Order.findOne({
    user: userId,
    'items.product': productId,
    orderStatus: 'delivered'
  });
  
  if (!order) return { canReview: false, reason: 'not_purchased' };
  
  return { canReview: true, orderId: order._id };
};

// Vote on review helpfulness
reviewSchema.methods.vote = function(userId, voteType) {
  // Check if already voted
  const existingVote = this.votedBy.find(v => v.user.equals(userId));
  
  if (existingVote) {
    // Remove old vote
    if (existingVote.vote === 'up') this.helpfulVotes.up--;
    else this.helpfulVotes.down--;
    
    if (existingVote.vote === voteType) {
      // Toggle off - remove vote
      this.votedBy = this.votedBy.filter(v => !v.user.equals(userId));
    } else {
      // Change vote
      existingVote.vote = voteType;
      if (voteType === 'up') this.helpfulVotes.up++;
      else this.helpfulVotes.down++;
    }
  } else {
    // New vote
    this.votedBy.push({ user: userId, vote: voteType });
    if (voteType === 'up') this.helpfulVotes.up++;
    else this.helpfulVotes.down++;
  }
  
  return this.save();
};

// Update product rating after save
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const summary = await this.constructor.getRatingSummary(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    'ratings.average': summary.average,
    'ratings.count': summary.total
  });
});

// Update product rating after remove
reviewSchema.post('deleteOne', { document: true }, async function() {
  const Product = mongoose.model('Product');
  const summary = await this.constructor.getRatingSummary(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    'ratings.average': summary.average,
    'ratings.count': summary.total
  });
});

module.exports = mongoose.model('Review', reviewSchema);
