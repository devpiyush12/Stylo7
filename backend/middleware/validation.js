/**
 * Input Validation Middleware
 */

/**
 * Validate email
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone (India)
 */
const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone.replace(/\D/g, ''));
};

/**
 * Validate pincode (India)
 */
const validatePincode = (pincode) => {
  const re = /^\d{6}$/;
  return re.test(pincode);
};

/**
 * Register validation
 */
exports.validateRegister = (req, res, next) => {
  const { name, email, phone, password } = req.body;

  if (!name || name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters',
      errors: ['name']
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      errors: ['email']
    });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number',
      errors: ['phone']
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
      errors: ['password']
    });
  }

  next();
};

/**
 * Address validation
 */
exports.validateAddress = (req, res, next) => {
  const { fullName, phone, addressLine1, city, state, pincode } = req.body;

  if (!fullName || fullName.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full name is required',
      errors: ['fullName']
    });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number',
      errors: ['phone']
    });
  }

  if (!addressLine1 || addressLine1.length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Address is required',
      errors: ['addressLine1']
    });
  }

  if (!city || city.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'City is required',
      errors: ['city']
    });
  }

  if (!state || state.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'State is required',
      errors: ['state']
    });
  }

  if (!validatePincode(pincode)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pincode',
      errors: ['pincode']
    });
  }

  next();
};

/**
 * Review validation
 */
exports.validateReview = (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5',
      errors: ['rating']
    });
  }

  if (!comment || comment.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Comment must be at least 10 characters',
      errors: ['comment']
    });
  }

  next();
};

module.exports = exports;
