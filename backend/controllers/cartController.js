/**
 * Cart Controller
 * Shopping cart management
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

/**
 * Get user cart
 * GET /api/cart
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.session?.id;

    let cart = await Cart.findOne({
      $or: [
        { user: userId },
        { sessionId }
      ]
    }).populate('items.product', 'name styleNo images').populate('coupon');

    if (!cart) {
      cart = new Cart({
        user: userId,
        sessionId: !userId ? sessionId : undefined
      });
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      errors: [err.message]
    });
  }
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
exports.addItem = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const userId = req.user?.id;
    const sessionId = req.session?.id;

    // Validation
    if (!productId || !variantId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or quantity',
        errors: ['productId', 'variantId', 'quantity']
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        errors: ['productId']
      });
    }

    // Get variant
    const variant = product.variants.find(v => v._id.equals(variantId));
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
        errors: ['variantId']
      });
    }

    // Check stock
    if (variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stock} items in stock`,
        errors: ['quantity']
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({
      $or: [
        { user: userId },
        { sessionId }
      ]
    });

    if (!cart) {
      cart = new Cart({
        user: userId,
        sessionId: !userId ? sessionId : undefined
      });
    }

    // Add item
    await cart.addItem(product, variantId, variant.size, variant.color, variant.sku, quantity);
    await cart.updateShipping();
    await cart.save();

    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (err) {
    console.error('Add item error:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding item',
      errors: [err.message]
    });
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/items/:itemId
 */
exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.session?.id;

    const cart = await Cart.findOne({
      $or: [
        { user: userId },
        { sessionId }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
        errors: ['notFound']
      });
    }

    await cart.removeItem(itemId);
    await cart.updateShipping();
    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (err) {
    console.error('Remove item error:', err);
    res.status(500).json({
      success: false,
      message: 'Error removing item',
      errors: [err.message]
    });
  }
};

/**
 * Update item quantity
 * PUT /api/cart/items/:itemId
 */
exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;
    const sessionId = req.session?.id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity',
        errors: ['quantity']
      });
    }

    const cart = await Cart.findOne({
      $or: [
        { user: userId },
        { sessionId }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
        errors: ['notFound']
      });
    }

    await cart.updateQuantity(itemId, quantity);
    await cart.updateShipping();
    await cart.save();

    res.json({
      success: true,
      message: 'Quantity updated',
      data: cart
    });
  } catch (err) {
    console.error('Update quantity error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating quantity',
      errors: [err.message]
    });
  }
};

/**
 * Apply coupon to cart
 * POST /api/cart/coupon/apply
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user?.id;
    const sessionId = req.session?.id;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
        errors: ['couponCode']
      });
    }

    // Get cart
    const cart = await Cart.findOne({
      $or: [
        { user: userId },
        { sessionId }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
        errors: ['notFound']
      });
    }

    // Find coupon
    const coupon = await Coupon.findValidByCode(couponCode);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code',
        errors: ['couponCode']
      });
    }

    // Check applicability
    const check = coupon.isApplicable(cart, userId);
    if (!check.valid) {
      return res.status(400).json({
        success: false,
        message: 'Coupon cannot be applied',
        errors: check.errors
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(cart);

    // Apply coupon
    await cart.applyCoupon(coupon, discount);
    await cart.save();

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        cart,
        discount
      }
    });
  } catch (err) {
    console.error('Apply coupon error:', err);
    res.status(500).json({
      success: false,
      message: 'Error applying coupon',
      errors: [err.message]
    });
  }
};

/**
 * Remove coupon from cart
 * DELETE /api/cart/coupon
 */
exports.removeCoupon = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.session?.id;

    const cart = await Cart.findOne({
      $or: [
        { user: userId },
        { sessionId }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
        errors: ['notFound']
      });
    }

    await cart.clearCoupon();
    await cart.save();

    res.json({
      success: true,
      message: 'Coupon removed',
      data: cart
    });
  } catch (err) {
    console.error('Remove coupon error:', err);
    res.status(500).json({
      success: false,
      message: 'Error removing coupon',
      errors: [err.message]
    });
  }
};

/**
 * Clear entire cart
 * DELETE /api/cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.session?.id;

    const cart = await Cart.findOne({
      $or: [
        { user: userId },
        { sessionId }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
        errors: ['notFound']
      });
    }

    cart.items = [];
    cart.coupon = undefined;
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    await cart.recalculate();
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      errors: [err.message]
    });
  }
};

module.exports = exports;
