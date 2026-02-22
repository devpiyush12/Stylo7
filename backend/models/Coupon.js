/**
 * Coupon Model
 * Discount coupons with various types and restrictions
 */

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  description: {
    type: String,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['percentage', 'flat', 'shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  // For percentage: max discount amount
  maxDiscount: {
    type: Number,
    default: 0
  },
  // Minimum order value to apply
  minOrderValue: {
    type: Number,
    default: 0
  },
  // Usage limits
  usageLimit: {
    total: { type: Number, default: 0 }, // 0 = unlimited
    perUser: { type: Number, default: 1 }
  },
  usageCount: {
    total: { type: Number, default: 0 },
    byUser: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      count: { type: Number, default: 0 }
    }]
  },
  // Applicable products/categories
  applicability: {
    type: {
      type: String,
      enum: ['all', 'products', 'categories'],
      default: 'all'
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }]
  },
  // Validity period
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  // First-time user only
  firstTimeOnly: {
    type: Boolean,
    default: false
  },
  // User restrictions
  userRestrictions: {
    minOrders: { type: Number, default: 0 }, // Minimum orders placed
    maxOrders: { type: Number, default: 0 }, // 0 = no limit
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }] // Specific users only (empty = all users)
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Auto-apply settings
  autoApply: {
    type: Boolean,
    default: false
  },
  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Notes
  notes: String
}, { timestamps: true });

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

// Virtual: is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (this.usageLimit.total === 0 || this.usageCount.total < this.usageLimit.total);
});

// Check if coupon is applicable to cart
couponSchema.methods.isApplicable = function(cart, userId = null) {
  const errors = [];
  
  // Check validity
  if (!this.isValid) {
    errors.push('Coupon has expired or is inactive');
    return { valid: false, errors };
  }
  
  // Check minimum order value
  if (cart.subtotal < this.minOrderValue) {
    errors.push(`Minimum order value of ₹${this.minOrderValue} required`);
  }
  
  // Check user restrictions
  if (userId && this.userRestrictions.users.length > 0) {
    if (!this.userRestrictions.users.some(u => u.equals(userId))) {
      errors.push('This coupon is not available for your account');
    }
  }
  
  // Check usage limit per user
  if (userId) {
    const userUsage = this.usageCount.byUser.find(u => u.user.equals(userId));
    if (userUsage && userUsage.count >= this.usageLimit.perUser) {
      errors.push(`Coupon can only be used ${this.usageLimit.perUser} time(s) per user`);
    }
  }
  
  // Check first-time user restriction
  if (this.firstTimeOnly && userId) {
    // Will need to check order count in controller
    errors.push('_CHECK_FIRST_TIME_');
  }
  
  // Check product/category applicability
  if (this.applicability.type === 'products') {
    const applicableItems = cart.items.filter(item =>
      this.applicability.products.some(p => p.equals(item.product))
    );
    if (applicableItems.length === 0) {
      errors.push('Coupon is not applicable to items in your cart');
    }
  }
  
  if (this.applicability.type === 'categories') {
    // Will need to check product categories in controller
    errors.push('_CHECK_CATEGORIES_');
  }
  
  return { 
    valid: errors.length === 0 || (errors.length === 1 && errors[0].startsWith('_CHECK_')),
    errors: errors.filter(e => !e.startsWith('_CHECK_'))
  };
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(cart) {
  let discount = 0;
  
  switch (this.type) {
    case 'percentage':
      discount = (cart.subtotal * this.value) / 100;
      if (this.maxDiscount > 0) {
        discount = Math.min(discount, this.maxDiscount);
      }
      break;
      
    case 'flat':
      discount = Math.min(this.value, cart.subtotal);
      break;
      
    case 'shipping':
      discount = cart.shippingCharge;
      break;
  }
  
  return Math.round(discount * 100) / 100;
};

// Increment usage
couponSchema.methods.incrementUsage = function(userId) {
  this.usageCount.total++;
  
  if (userId) {
    const userUsage = this.usageCount.byUser.find(u => u.user.equals(userId));
    if (userUsage) {
      userUsage.count++;
    } else {
      this.usageCount.byUser.push({ user: userId, count: 1 });
    }
  }
  
  return this.save();
};

// Static: Find valid coupon by code
couponSchema.statics.findValidByCode = function(code) {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });
};

// Static: Get active coupons
couponSchema.statics.getActiveCoupons = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });
};

module.exports = mongoose.model('Coupon', couponSchema);
