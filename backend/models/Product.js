/**
 * Product Model
 * Stores product information with variants, images, and ratings
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
    required: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  colorCode: {
    type: String,
    match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code']
  },
  sku: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  mrp: {
    type: Number,
    required: true,
    min: [0, 'MRP cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: [0, 'Selling price cannot be negative']
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  }
}, { _id: true });

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  altText: {
    type: String,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  styleNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    minlength: [20, 'Description must be at least 20 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    default: 'Stylo7',
    trim: true
  },
  images: [imageSchema],
  variants: [variantSchema],
  mrp: {
    type: Number,
    required: true,
    min: [0, 'MRP cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: [0, 'Selling price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  gst: {
    type: Number,
    default: 5,
    min: [0, 'GST cannot be negative'],
    max: [100, 'GST cannot exceed 100%']
  },
  tags: [String],
  fabric: {
    type: String,
    trim: true
  },
  fit: {
    type: String,
    enum: ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Oversized', 'Skinny'],
    default: 'Regular Fit'
  },
  occasion: {
    type: String,
    enum: ['Casual', 'Formal', 'Sports', 'Party', 'All Occasion'],
    default: 'Casual'
  },
  washCare: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isTrending: {
    type: Boolean,
    default: false,
    index: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', styleNo: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isTrending: 1, isActive: 1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ createdAt: -1 });

// Auto-generate slug before saving
productSchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
    replace: /\s+/g, '-'
  });
  
  // Calculate discount percentage
  if (this.mrp && this.sellingPrice) {
    this.discount = Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
  
  next();
});

// Virtual for total stock
productSchema.virtual('totalStock').get(function() {
  return this.variants.reduce((sum, variant) => sum + variant.stock, 0);
});

// Virtual for is in stock
productSchema.virtual('inStock').get(function() {
  return this.totalStock > 0;
});

// Virtual for low stock variants
productSchema.virtual('lowStockVariants').get(function() {
  return this.variants.filter(v => v.stock <= v.lowStockThreshold);
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  return this.images.find(img => img.isPrimary) || this.images[0];
});

// Instance methods
productSchema.methods.getVariantBySKU = function(sku) {
  return this.variants.find(v => v.sku === sku);
};

productSchema.methods.updateStock = async function(sku, quantity) {
  const variant = this.getVariantBySKU(sku);
  if (!variant) throw new Error('Variant not found');
  
  variant.stock += quantity;
  if (variant.stock < 0) throw new Error('Insufficient stock');
  
  await this.save();
  return variant;
};

// Static methods
productSchema.statics.findByCategory = function(categoryId, options = {}) {
  const { page = 1, limit = 20 } = options;
  return this.find({ category: categoryId, isActive: true })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
};

productSchema.statics.searchProducts = function(query, options = {}) {
  const { page = 1, limit = 20, minPrice, maxPrice, sizes, sort } = options;
  
  let filter = { isActive: true };
  
  if (minPrice || maxPrice) {
    filter.sellingPrice = {};
    if (minPrice) filter.sellingPrice.$gte = minPrice;
    if (maxPrice) filter.sellingPrice.$lte = maxPrice;
  }
  
  let sortObj = { createdAt: -1 };
  if (sort === 'price_asc') sortObj = { sellingPrice: 1 };
  if (sort === 'price_desc') sortObj = { sellingPrice: -1 };
  if (sort === 'popularity') sortObj = { sold: -1 };
  
  let queryObj = this.find(filter);
  
  if (query) {
    queryObj = queryObj.where({
      $text: { $search: query }
    });
  }
  
  if (sizes && sizes.length) {
    queryObj = queryObj.where('variants.size').in(sizes);
  }
  
  return queryObj
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
