/**
 * User Controller
 * User profile and preferences management
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Get user profile
 * GET /api/users/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['notFound']
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      errors: [err.message]
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, phone, gender, dateOfBirth } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['notFound']
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) {
      // Check if phone is already registered
      const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already registered',
          errors: ['phone']
        });
      }
      user.phone = phone;
    }
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      errors: [err.message]
    });
  }
};

/**
 * Update password
 * PUT /api/users/password
 */
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords are required',
        errors: ['currentPassword', 'newPassword']
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        errors: ['confirmPassword']
      });
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['notFound']
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        errors: ['currentPassword']
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      errors: [err.message]
    });
  }
};

/**
 * Get user addresses
 * GET /api/users/addresses
 */
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const user = await User.findById(userId).select('addresses');

    res.json({
      success: true,
      data: user?.addresses || []
    });
  } catch (err) {
    console.error('Get addresses error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching addresses',
      errors: [err.message]
    });
  }
};

/**
 * Add new address
 * POST /api/users/addresses
 */
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All address fields are required',
        errors: ['address']
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['notFound']
      });
    }

    user.addresses.push({
      label: label || 'Home',
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode
    });

    await user.save();

    res.json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (err) {
    console.error('Add address error:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding address',
      errors: [err.message]
    });
  }
};

/**
 * Update address
 * PUT /api/users/addresses/:addressId
 */
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['notFound']
      });
    }

    const address = user.addresses.find(a => a._id.equals(addressId));

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
        errors: ['notFound']
      });
    }

    // Update address fields
    Object.assign(address, updates);
    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      errors: [err.message]
    });
  }
};

/**
 * Delete address
 * DELETE /api/users/addresses/:addressId
 */
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['notFound']
      });
    }

    user.addresses = user.addresses.filter(a => !a._id.equals(addressId));
    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: user.addresses
    });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting address',
      errors: [err.message]
    });
  }
};

/**
 * Get wishlist
 * GET /api/users/wishlist
 */
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const user = await User.findById(userId).select('wishlist').populate('wishlist', 'name styleNo images mrp');

    res.json({
      success: true,
      data: user?.wishlist || []
    });
  } catch (err) {
    console.error('Get wishlist error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      errors: [err.message]
    });
  }
};

/**
 * Toggle product in wishlist
 * POST /api/users/wishlist/:productId
 */
exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        errors: ['auth']
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['notFound']
      });
    }

    const index = user.wishlist.findIndex(id => id.equals(productId));

    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();

    res.json({
      success: true,
      message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist',
      data: user.wishlist
    });
  } catch (err) {
    console.error('Toggle wishlist error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating wishlist',
      errors: [err.message]
    });
  }
};

module.exports = exports;
