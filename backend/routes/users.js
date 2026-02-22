/**
 * User Routes
 */

const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { validateAddress } = require('../middleware/validation');

const router = express.Router();

// Get profile
router.get('/profile', verifyToken, userController.getProfile);

// Update profile
router.put('/profile', verifyToken, userController.updateProfile);

// Update password
router.put('/password', verifyToken, userController.updatePassword);

// Get addresses
router.get('/addresses', verifyToken, userController.getAddresses);

// Add address
router.post('/addresses', verifyToken, validateAddress, userController.addAddress);

// Update address
router.put('/addresses/:addressId', verifyToken, validateAddress, userController.updateAddress);

// Delete address
router.delete('/addresses/:addressId', verifyToken, userController.deleteAddress);

// Get wishlist
router.get('/wishlist', verifyToken, userController.getWishlist);

// Toggle wishlist
router.post('/wishlist/:productId', verifyToken, userController.toggleWishlist);

module.exports = router;
