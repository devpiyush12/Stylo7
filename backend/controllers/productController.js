/**
 * Product Controller
 * Product listing, search, filtering, and details
 */

const Product = require('../models/Product');
const Review = require('../models/Review');

/**
 * Get all products with pagination and filters
 * GET /api/products
 * Query: page, limit, category, search, size, color, priceMin, priceMax, sort, inStock
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      size,
      color,
      priceMin,
      priceMax,
      sort = '-createdAt',
      inStock = true
    } = req.query;

    // Build filter
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (size) {
      filter['variants.size'] = size;
    }

    if (color) {
      filter['variants.color'] = color;
    }

    if (inStock === 'true') {
      filter['variants.stock'] = { $gt: 0 };
    }

    // Price filter
    if (priceMin || priceMax) {
      filter['variants.price'] = {};
      if (priceMin) filter['variants.price'].$gte = parseFloat(priceMin);
      if (priceMax) filter['variants.price'].$lte = parseFloat(priceMax);
    }

    // Count total
    const total = await Product.countDocuments(filter);

    // Fetch products
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name styleNo mrp images variants ratings category isActive');

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      errors: [err.message]
    });
  }
};

/**
 * Search products by text
 * GET /api/products/search
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        errors: ['q']
      });
    }

    const products = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .select('name styleNo images mrp ratings');

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      errors: [err.message]
    });
  }
};

/**
 * Get product by ID with full details
 * GET /api/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('category');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['notFound']
      });
    }

    // Get reviews summary
    const reviewSummary = await Review.getRatingSummary(product._id);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        reviewSummary
      }
    });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      errors: [err.message]
    });
  }
};

/**
 * Get product variants
 * GET /api/products/:id/variants
 */
exports.getVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, color } = req.query;

    const product = await Product.findById(id).select('variants');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['notFound']
      });
    }

    let variants = product.variants;

    // Filter by size
    if (size) {
      variants = variants.filter(v => v.size === size);
    }

    // Filter by color
    if (color) {
      variants = variants.filter(v => v.color === color);
    }

    res.json({
      success: true,
      data: variants
    });
  } catch (err) {
    console.error('Get variants error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching variants',
      errors: [err.message]
    });
  }
};

/**
 * Get product reviews and ratings
 * GET /api/products/:id/reviews
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Get summary
    const summary = await Review.getRatingSummary(id);

    // Get reviews
    const reviews = await Review.getProductReviews(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      rating: rating ? parseInt(rating) : null
    });

    const total = await Review.countDocuments({
      product: id,
      isApproved: true,
      ...(rating && { rating: parseInt(rating) })
    });

    res.json({
      success: true,
      data: {
        summary,
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
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
 * Get related products
 * GET /api/products/:id/related
 */
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['notFound']
      });
    }

    // Get related products (same category, different product)
    const related = await Product.find({
      category: product.category,
      _id: { $ne: id },
      isActive: true
    })
      .limit(parseInt(limit))
      .select('name styleNo images mrp ratings');

    res.json({
      success: true,
      data: related
    });
  } catch (err) {
    console.error('Get related error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products',
      errors: [err.message]
    });
  }
};

/**
 * Get featured products
 * GET /api/products/featured
 */
exports.getFeatured = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      isActive: true,
      isFeatured: true
    })
      .limit(parseInt(limit))
      .select('name styleNo images mrp ratings')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    console.error('Get featured error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      errors: [err.message]
    });
  }
};

module.exports = exports;
