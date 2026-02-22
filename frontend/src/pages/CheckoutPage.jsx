import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { getCart } from '../store/slices/cartSlice';
import { createOrder } from '../store/slices/ordersSlice';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/common/Loader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { formatPrice, validateAddress, showToast } from '../utils';

/**
 * CheckoutPage - Checkout flow
 */
const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { cart, loading: cartLoading } = useSelector((state) => state.cart);
  const { loading: orderLoading } = useSelector((state) => state.orders);

  const [step, setStep] = useState(1); // 1: Address, 2: Payment
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    }
  }, [user, navigate]);

  if (cartLoading) return <PageLoader />;
  if (!cart?.items?.length) {
    navigate('/cart');
    return null;
  }

  const subtotal = cart?.subtotal || 0;
  const discount = cart?.discount || 0;
  const shipping = subtotal >= 2499 ? 0 : 99;
  const codCharge = paymentMethod === 'cod' ? 29 : 0;
  const total = subtotal - discount + shipping + codCharge;

  const handleAddressChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep1 = () => {
    const addressErrors = validateAddress(address);
    if (addressErrors) {
      setErrors(addressErrors);
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    const orderData = {
      shippingAddress: address,
      paymentMethod,
    };

    const result = await dispatch(createOrder(orderData));
    if (result.payload?._id) {
      if (paymentMethod === 'razorpay') {
        // Initialize Razorpay
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: total * 100,
          currency: 'INR',
          order_id: result.payload.razorpayOrderId,
          handler: (response) => {
            navigate(`/order-success/${result.payload._id}`);
          },
          prefill: {
            name: address.name,
            contact: address.phone,
            email: user.email,
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        navigate(`/order-success/${result.payload._id}`);
      }
    }
  };

  const paymentOptions = [
    { value: 'razorpay', label: 'Pay Online (Razorpay)' },
    { value: 'cod', label: 'Cash on Delivery (+₹29)' },
  ];

  const states = [
    'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi', 'Karnataka',
    'Tamil Nadu', 'Uttar Pradesh', 'West Bengal', 'Punjab', 'Haryana', 'Kerala',
    // Add more as needed
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              1
            </span>
            <span className="font-medium">Address</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
              2
            </span>
            <span className="font-medium">Payment</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              {step === 1 ? (
                <>
                  <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                  
                  <div className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        value={address.name}
                        onChange={(e) => handleAddressChange('name', e.target.value)}
                        error={errors.name}
                        required
                      />
                      <Input
                        label="Phone"
                        value={address.phone}
                        onChange={(e) => handleAddressChange('phone', e.target.value)}
                        error={errors.phone}
                        required
                      />
                    </div>
                    
                    <Input
                      label="Address Line 1"
                      placeholder="House/Flat No., Building Name"
                      value={address.line1}
                      onChange={(e) => handleAddressChange('line1', e.target.value)}
                      error={errors.line1}
                      required
                    />
                    
                    <Input
                      label="Address Line 2 (Optional)"
                      placeholder="Street, Locality"
                      value={address.line2}
                      onChange={(e) => handleAddressChange('line2', e.target.value)}
                    />
                    
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Input
                        label="City"
                        value={address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        error={errors.city}
                        required
                      />
                      <Select
                        label="State"
                        value={address.state}
                        onChange={(val) => handleAddressChange('state', val)}
                        options={[
                          { value: '', label: 'Select State' },
                          ...states.map(s => ({ value: s, label: s })),
                        ]}
                        error={errors.state}
                      />
                      <Input
                        label="PIN Code"
                        value={address.pincode}
                        onChange={(e) => handleAddressChange('pincode', e.target.value)}
                        error={errors.pincode}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleContinue}>
                      Continue to Payment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                  
                  <div className="space-y-3 mb-6">
                    {paymentOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                          paymentMethod === option.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={option.value}
                          checked={paymentMethod === option.value}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Address Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Deliver to:</h3>
                    <p className="text-sm text-gray-600">
                      {address.name}, {address.line1}
                      {address.line2 && `, ${address.line2}`}
                      <br />
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="text-sm text-primary-600 mt-2"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      fullWidth
                      onClick={handlePlaceOrder}
                      loading={orderLoading}
                    >
                      Place Order - {formatPrice(total)}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {cart?.items?.map((item) => (
                  <div key={`${item.product._id}-${item.variant._id}`} className="flex gap-3">
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.variant?.size} • Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                {codCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">COD Charges</span>
                    <span>{formatPrice(codCharge)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
