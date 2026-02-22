import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCartStart,
  fetchCartSuccess,
  fetchCartFailure,
  addToCartStart,
  addToCartSuccess,
  addToCartFailure,
  removeFromCartStart,
  removeFromCartSuccess,
  removeFromCartFailure,
  updateCartItemStart,
  updateCartItemSuccess,
  updateCartItemFailure,
  clearCartStart,
  clearCartSuccess,
  clearCartFailure,
  applyCouponStart,
  applyCouponSuccess,
  applyCouponFailure,
  removeCouponStart,
  removeCouponSuccess,
  removeCouponFailure,
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartCount,
  selectCartLoading,
  selectCartError,
  selectCoupon
} from '../store/slices/cartSlice';
import api from '../api';

/**
 * Custom hook for cart operations
 */
export function useCart() {
  const dispatch = useDispatch();
  
  const cart = useSelector(selectCart);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);
  const loading = useSelector(selectCartLoading);
  const error = useSelector(selectCartError);
  const coupon = useSelector(selectCoupon);

  /**
   * Fetch cart from server
   */
  const fetchCart = useCallback(async () => {
    try {
      dispatch(fetchCartStart());
      const { data } = await api.get('/cart');
      dispatch(fetchCartSuccess(data.data));
      return { success: true, cart: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch cart';
      dispatch(fetchCartFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Add item to cart
   */
  const addToCart = useCallback(async (productId, variantId, quantity = 1) => {
    try {
      dispatch(addToCartStart());
      const { data } = await api.post('/cart/items', { productId, variantId, quantity });
      dispatch(addToCartSuccess(data.data));
      return { success: true, cart: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add to cart';
      dispatch(addToCartFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(async (itemId) => {
    try {
      dispatch(removeFromCartStart());
      const { data } = await api.delete(`/cart/items/${itemId}`);
      dispatch(removeFromCartSuccess(data.data));
      return { success: true, cart: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove item';
      dispatch(removeFromCartFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Update cart item quantity
   */
  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      dispatch(updateCartItemStart());
      const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
      dispatch(updateCartItemSuccess(data.data));
      return { success: true, cart: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update quantity';
      dispatch(updateCartItemFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(async () => {
    try {
      dispatch(clearCartStart());
      const { data } = await api.delete('/cart');
      dispatch(clearCartSuccess());
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to clear cart';
      dispatch(clearCartFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Apply coupon to cart
   */
  const applyCoupon = useCallback(async (code) => {
    try {
      dispatch(applyCouponStart());
      const { data } = await api.post('/cart/coupon', { code });
      dispatch(applyCouponSuccess(data.data));
      return { success: true, cart: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid coupon';
      dispatch(applyCouponFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Remove coupon from cart
   */
  const removeCoupon = useCallback(async () => {
    try {
      dispatch(removeCouponStart());
      const { data } = await api.delete('/cart/coupon');
      dispatch(removeCouponSuccess(data.data));
      return { success: true, cart: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove coupon';
      dispatch(removeCouponFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Check if product is in cart
   */
  const isInCart = useCallback((productId, variantId) => {
    return items.some(
      item => item.productId === productId && item.variantId === variantId
    );
  }, [items]);

  /**
   * Get item quantity in cart
   */
  const getItemQuantity = useCallback((productId, variantId) => {
    const item = items.find(
      item => item.productId === productId && item.variantId === variantId
    );
    return item?.quantity || 0;
  }, [items]);

  /**
   * Calculate cart summary
   */
  const getCartSummary = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = coupon?.discount || 0;
    const shipping = subtotal >= 2500 ? 0 : 99; // Free shipping over ₹2500
    const tax = (subtotal - discount) * 0.18; // 18% GST
    const grandTotal = subtotal - discount + shipping + tax;

    return {
      subtotal,
      discount,
      shipping,
      tax,
      grandTotal,
      itemCount: count,
      freeShippingThreshold: 2500,
      freeShippingRemaining: Math.max(0, 2500 - subtotal)
    };
  }, [items, coupon, count]);

  return {
    cart,
    items,
    total,
    count,
    loading,
    error,
    coupon,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    isInCart,
    getItemQuantity,
    getCartSummary
  };
}

export default useCart;
