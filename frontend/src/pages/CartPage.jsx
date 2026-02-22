import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCart, applyCoupon, removeCoupon } from '../store/slices/cartSlice';
import { CartItem } from '../components/features';
import { PageLoader } from '../components/common/Loader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { formatPrice } from '../utils';

/**
 * CartPage - Shopping cart
 */
const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { cart, loading } = useSelector((state) => state.cart);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    await dispatch(applyCoupon(couponCode));
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  if (loading) return <PageLoader />;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const discount = cart?.discount || 0;
  const coupon = cart?.coupon;
  const shipping = subtotal >= 2499 ? 0 : 99;
  const total = subtotal - discount + shipping;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <CartItem key={`${item.product._id}-${item.variant._id}`} item={item} />
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                {/* Coupon */}
                <div className="mb-6">
                  {coupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800">{coupon.code}</p>
                        <p className="text-sm text-green-600">{coupon.description}</p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        loading={couponLoading}
                        variant="secondary"
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <span>{formatPrice(shipping)}</span>
                    )}
                  </div>
                  {subtotal < 2499 && (
                    <p className="text-sm text-gray-500">
                      Add {formatPrice(2499 - subtotal)} more for free shipping!
                    </p>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>

                <Link to="/products" className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
