/**
 * Format price in Indian Rupees
 * @param {number} price - Price in rupees
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Format price without currency symbol
 * @param {number} price - Price in rupees
 * @returns {string} Formatted price number
 */
export const formatPriceNumber = (price) => {
  if (typeof price !== 'number' || isNaN(price)) return '0';
  return new Intl.NumberFormat('en-IN').format(price);
};
