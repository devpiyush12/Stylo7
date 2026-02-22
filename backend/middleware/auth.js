/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verify JWT token
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        errors: ['noToken']
      });
    }

    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        errors: ['userNotFound']
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      errors: ['invalidToken']
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, SECRET);
      const user = await User.findById(decoded.userId);

      if (user) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role
        };
      }
    }

    next();
  } catch (err) {
    // Silently fail optional auth
    next();
  }
};

/**
 * Admin only middleware
 */
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      errors: ['notAdmin']
    });
  }
  next();
};

module.exports = exports;
