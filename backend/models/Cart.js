/**
 * Cart Model
 * Shopping cart with variant selection and price calculations
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  size: { type: String, required: true },
  color: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  mrp: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  inStock: { type: Boolean, default: true }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  sessionId: {
    type: String,
    sparse: true,
    index: true
  },
  items: [cartItemSchema],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  totalMRP: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  itemsCount: { type: Number, default: 0 },
  lastModified: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // TTL: 30 days

// Recalculate cart totals
cartSchema.methods.recalculate = async function() {
  // Populate product data for stock checks
  await this.populate('items.product', 'name images styleNo variants isActive');

  // Remove inactive products
  this.items = this.items.filter(item => 
    item.product && item.product.isActive
  );

  // Recalculate totals
  this.totalMRP = 0;
  this.totalDiscount = 0;
  this.subtotal = 0;
  this.itemsCount = 0;

  for (const item of this.items) {
    // Find variant and check stock
    const variant = item.product?.variants?.find(v => v._id.equals(item.variant));
    item.inStock = variant ? variant.stock >= item.quantity : false;
    
    // Calculate item totals
    item.total = item.price * item.quantity;
    item.discount = item.mrp - item.price;
    
    // Add to cart totals
    this.totalMRP += item.mrp * item.quantity;
    this.subtotal += item.total;
    this.itemsCount += item.quantity;
  }

  this.totalDiscount = this.totalMRP - this.subtotal;

  // Apply coupon discount if valid
  if (this.couponDiscount > 0) {
    this.grandTotal = Math.max(0, this.subtotal + this.shippingCharge - this.couponDiscount);
  } else {
    this.grandTotal = this.subtotal + this.shippingCharge;
  }

  this.lastModified = new Date();
  return this;
};

// Update shipping based on free shipping threshold (₹2500)
cartSchema.methods.updateShipping = function(freeShippingThreshold = 2500, codCharge = 29) {
  if (this.subtotal >= freeShippingThreshold) {
    this.shippingCharge = 0;
  } else {
    this.shippingCharge = 50; // Standard shipping
  }
  return this;
};

// Add item to cart
cartSchema.methods.addItem = async function(product, variantId, size, color, sku, quantity = 1) {
  // Check if item already exists
  const existingIndex = this.items.findIndex(item => 
    item.variant.toString() === variantId.toString()
  );

  if (existingIndex > -1) {
    // Update quantity
    this.items[existingIndex].quantity += quantity;
  } else {
    // Add new item
    const variant = product.variants.find(v => v._id.equals(variantId));
    if (!variant) throw new Error('Variant not found');

    this.items.push({
      product: product._id,
      variant: variantId,
      size,
      color,
      sku,
      quantity,
      mrp: variant.mrp || product.mrp,
      price: variant.price || product.price,
      discount: (variant.mrp || product.mrp) - (variant.price || product.price),
      total: (variant.price || product.price) * quantity,
      inStock: variant.stock >= quantity
    });
  }

  await this.recalculate();
  return this;
};

// Remove item from cart
cartSchema.methods.removeItem = async function(itemId) {
  this.items = this.items.filter(item => !item._id.equals(itemId));
  await this.recalculate();
  return this;
};

// Update item quantity
cartSchema.methods.updateQuantity = async function(itemId, quantity) {
  const item = this.items.find(item => item._id.equals(itemId));
  if (!item) throw new Error('Item not found');
  
  if (quantity <= 0) {
    return this.removeItem(itemId);
  }
  
  item.quantity = quantity;
  await this.recalculate();
  return this;
};

// Apply coupon
cartSchema.methods.applyCoupon = async function(coupon, discountAmount) {
  this.coupon = coupon._id;
  this.couponCode = coupon.code;
  this.couponDiscount = discountAmount;
  await this.recalculate();
  return this;
};

// Clear coupon
cartSchema.methods.clearCoupon = async function() {
  this.coupon = undefined;
  this.couponCode = undefined;
  this.couponDiscount = 0;
  await this.recalculate();
  return this;
};

// Merge guest cart with user cart
cartSchema.statics.mergeCarts = async function(userCart, guestCart) {
  if (!guestCart || guestCart.items.length === 0) return userCart;
  
  for (const item of guestCart.items) {
    const existingIndex = userCart.items.findIndex(i => 
      i.variant.toString() === item.variant.toString()
    );
    
    if (existingIndex > -1) {
      userCart.items[existingIndex].quantity += item.quantity;
    } else {
      userCart.items.push(item);
    }
  }
  
  // Keep the better coupon
  if (guestCart.couponDiscount > userCart.couponDiscount) {
    userCart.coupon = guestCart.coupon;
    userCart.couponCode = guestCart.couponCode;
    userCart.couponDiscount = guestCart.couponDiscount;
  }
  
  await userCart.recalculate();
  return userCart;
};

module.exports = mongoose.model('Cart', cartSchema);
