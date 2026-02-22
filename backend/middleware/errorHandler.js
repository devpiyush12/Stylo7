/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errors: [field]
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      errors: ['token']
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      errors: ['expired']
    });
  }

  // Generic error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: [err.message]
  });
};

/**
 * 404 Not Found Handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: ['notFound']
  });
};

module.exports = { errorHandler, notFound };
