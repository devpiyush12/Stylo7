/**
 * Validation utilities
 */

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Indian phone number regex (with or without +91)
const PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;

// PIN code regex
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Invalid email format';
  return null;
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {string|null} Error message or null if valid
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {string|null} Error message or null if valid
 */
export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!PHONE_REGEX.test(phone.replace(/\s/g, ''))) return 'Invalid phone number';
  return null;
};

/**
 * Validate PIN code
 * @param {string} pincode - PIN code to validate
 * @returns {string|null} Error message or null if valid
 */
export const validatePincode = (pincode) => {
  if (!pincode) return 'PIN code is required';
  if (!PINCODE_REGEX.test(pincode)) return 'Invalid PIN code';
  return null;
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 50) return 'Name must be less than 50 characters';
  return null;
};

/**
 * Validate address
 * @param {object} address - Address object
 * @returns {object} Object with field errors
 */
export const validateAddress = (address) => {
  const errors = {};
  
  if (!address?.name?.trim()) errors.name = 'Name is required';
  if (!address?.phone) errors.phone = 'Phone is required';
  else if (!PHONE_REGEX.test(address.phone.replace(/\s/g, ''))) {
    errors.phone = 'Invalid phone number';
  }
  if (!address?.line1?.trim()) errors.line1 = 'Address line 1 is required';
  if (!address?.city?.trim()) errors.city = 'City is required';
  if (!address?.state?.trim()) errors.state = 'State is required';
  if (!address?.pincode) errors.pincode = 'PIN code is required';
  else if (!PINCODE_REGEX.test(address.pincode)) {
    errors.pincode = 'Invalid PIN code';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Validate quantity
 * @param {number} quantity - Quantity to validate
 * @param {number} max - Maximum allowed quantity
 * @returns {string|null} Error message or null if valid
 */
export const validateQuantity = (quantity, max = 10) => {
  if (!quantity || quantity < 1) return 'Quantity must be at least 1';
  if (quantity > max) return `Maximum ${max} items allowed`;
  return null;
};
