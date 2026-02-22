import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import CartItem from '../components/features/CartItem';
import Button from '../components/common/Button';
import { formatPrice } from '../utils/helpers';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, removeItem, updateQuantity, applyCoupon, removeCoupon } = useCart();
  const { isAuthenticated } = useAuth();

  const handleQuantityChange = async (itemId, quantity) => {
    if (quantity < 1) return;
    await updateQuantity(itemId, quantity);
  };

  const handleRemoveItem = async (itemId) => {
    await removeItem(itemId);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <svg
            className="mx-auto h-24 w-24 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-500">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products">
            <Button variant="primary" className="mt-6">
              Start Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const subtotal = cart.subtotal || 0;
  const discount = cart.discount || 0;
  const shipping = subtotal >= 2500 ? 0 : 99;
  const total = subtotal - discount + shipping;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

              {/* Coupon Code */}
              {cart.coupon ? (
                <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">{cart.coupon.code}</p>
                    <p className="text-xs text-green-600">{cart.coupon.description}</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = new FormData(e.target).get('coupon');
                    if (code) applyCoupon(code);
                  }}
                  className="mb-4"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="coupon"
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </form>
              )}

              <dl className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="text-gray-900 font-medium">{formatPrice(subtotal)}</dd>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-green-600">Discount</dt>
                    <dd className="text-green-600 font-medium">-{formatPrice(discount)}</dd>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Shipping</dt>
                  <dd className="text-gray-900 font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </dd>
                </div>

                {subtotal < 2500 && (
                  <p className="text-xs text-gray-500">
                    Add {formatPrice(2500 - subtotal)} more for free shipping!
                  </p>
                )}

                <div className="flex justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">{formatPrice(total)}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>

              <div className="mt-4 text-center">
                <Link
                  to="/products"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <svg className="mx-auto h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-xs text-gray-500 mt-1">Secure Payment</p>
                  </div>
                  <div>
                    <svg className="mx-auto h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <p className="text-xs text-gray-500 mt-1">Easy Returns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
