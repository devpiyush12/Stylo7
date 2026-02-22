import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCart,
  addToCart as addToCartAction,
  updateCartItem,
  removeCartItem,
  applyCoupon as applyCouponAction,
  removeCoupon as removeCouponAction,
  clearCart as clearCartAction,
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectCartLoading,
  selectCartError
} from '../store/slices/cartSlice';

export function useCart() {
  const dispatch = useDispatch();
  
  const cart = useSelector(selectCart);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const count = useSelector(selectCartItemCount);
  const loading = useSelector(selectCartLoading);
  const error = useSelector(selectCartError);
  const coupon = cart.coupon;

  const handleFetchCart = useCallback(async () => {
    const result = await dispatch(fetchCart()).unwrap();
    return { success: true, cart: result };
  }, [dispatch]);

  const handleAddToCart = useCallback(async (productId, variantId, quantity = 1) => {
    const result = await dispatch(addToCartAction({ productId, variantId, quantity })).unwrap();
    return { success: true, cart: result };
  }, [dispatch]);

  const handleRemoveFromCart = useCallback(async (itemId) => {
    const result = await dispatch(removeCartItem(itemId)).unwrap();
    return { success: true, cart: result };
  }, [dispatch]);

  const handleUpdateQuantity = useCallback(async (itemId, quantity) => {
    const result = await dispatch(updateCartItem({ itemId, quantity })).unwrap();
    return { success: true, cart: result };
  }, [dispatch]);

  const handleClearCart = useCallback(async () => {
    await dispatch(clearCartAction()).unwrap();
    return { success: true };
  }, [dispatch]);

  const handleApplyCoupon = useCallback(async (code) => {
    const result = await dispatch(applyCouponAction(code)).unwrap();
    return { success: true, cart: result };
  }, [dispatch]);

  const handleRemoveCoupon = useCallback(async () => {
    const result = await dispatch(removeCouponAction()).unwrap();
    return { success: true, cart: result };
  }, [dispatch]);

  const isInCart = useCallback((productId, variantId) => {
    return items.some(
      item => item.productId === productId && item.variantId === variantId
    );
  }, [items]);

  const getItemQuantity = useCallback((productId, variantId) => {
    const item = items.find(
      item => item.productId === productId && item.variantId === variantId
    );
    return item?.quantity || 0;
  }, [items]);

  const getCartSummary = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = coupon?.discount || 0;
    const shipping = subtotal >= 2500 ? 0 : 99;
    const tax = (subtotal - discount) * 0.18;
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
    fetchCart: handleFetchCart,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    updateQuantity: handleUpdateQuantity,
    clearCart: handleClearCart,
    applyCoupon: handleApplyCoupon,
    removeCoupon: handleRemoveCoupon,
    isInCart,
    getItemQuantity,
    getCartSummary
  };
}

export default useCart;
