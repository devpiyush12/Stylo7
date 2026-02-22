/**
 * Admin Controller
 * Admin dashboard and management functions
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access dashboard',
        errors: ['auth']
      });
    }

    // Get stats for last 30 days
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Order stats
    const orderStats = await Order.getStats(startDate, endDate);

    // Total users
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Total products
    const totalProducts = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({
      'variants.stock': { $lte: 5 }
    });

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId user orderStatus billing.grandTotal createdAt')
      .populate('user', 'name email');

    // Pending reviews
    const pendingReviews = await Review.countDocuments({ isApproved: false });

    // Active coupons
    const activeCoupons = await Coupon.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        orders: {
          ...orderStats,
          totalOrders: orderStats.totalOrders || 0
        },
        users: {
          total: totalUsers,
          newThisMonth: newUsers
        },
        products: {
          total: totalProducts,
          lowStock: lowStockCount
        },
        reviews: {
          pending: pendingReviews
        },
        coupons: {
          active: activeCoupons
        },
        recentOrders
      },
      period: {
        startDate,
        endDate
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard',
      errors: [err.message]
    });
  }
};

/**
 * Get orders management
 * GET /api/admin/orders
 */
exports.getOrdersManagement = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access',
        errors: ['auth']
      });
    }

    const { page = 1, limit = 20, status, search } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email phone')
      .select('orderId user orderStatus billing.grandTotal payment.status createdAt');

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Orders management error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      errors: [err.message]
    });
  }
};

/**
 * Get products management
 * GET /api/admin/products
 */
exports.getProductsManagement = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access',
        errors: ['auth']
      });
    }

    const { page = 1, limit = 20, search, isActive } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { styleNo: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name')
      .select('name styleNo mrp images isActive ratings');

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Products management error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      errors: [err.message]
    });
  }
};

/**
 * Get users management
 * GET /api/admin/users
 */
exports.getUsersManagement = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access',
        errors: ['auth']
      });
    }

    const { page = 1, limit = 20, search, role } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email phone role createdAt lastLogin');

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Users management error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      errors: [err.message]
    });
  }
};

/**
 * Get reviews management
 * GET /api/admin/reviews
 */
exports.getReviewsManagement = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access',
        errors: ['auth']
      });
    }

    const { page = 1, limit = 20, isApproved } = req.query;

    const filter = {};
    if (isApproved !== undefined) {
      filter.isApproved = isApproved === 'true';
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('product', 'name')
      .populate('user', 'name email')
      .select('product user rating comment isApproved createdAt');

    const total = await Review.countDocuments(filter);

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
    console.error('Reviews management error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      errors: [err.message]
    });
  }
};

/**
 * Approve or reject review
 * PUT /api/admin/reviews/:reviewId
 */
exports.moderateReview = async (req, res) => {
  try {
    // Check admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can moderate',
        errors: ['auth']
      });
    }

    const { reviewId } = req.params;
    const { isApproved, adminReply } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        errors: ['notFound']
      });
    }

    if (isApproved !== undefined) {
      review.isApproved = isApproved;
    }

    if (adminReply) {
      review.adminReply = {
        message: adminReply,
        repliedAt: new Date(),
        repliedBy: req.user?.id
      };
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review moderated',
      data: review
    });
  } catch (err) {
    console.error('Moderate review error:', err);
    res.status(500).json({
      success: false,
      message: 'Error moderating review',
      errors: [err.message]
    });
  }
};

module.exports = exports;
