import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails } from '../store/slices/ordersSlice';
import { PageLoader } from '../components/common/Loader';
import { StatusBadge } from '../components/common/Badge';
import Button from '../components/common/Button';
import { formatPrice, formatDate } from '../utils';

/**
 * OrderDetailPage - Single order details
 */
const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getOrderDetails(id));
  }, [dispatch, id]);

  if (loading) return <PageLoader />;
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
          <Link to="/orders"><Button>View Orders</Button></Link>
        </div>
      </div>
    );
  }

  const {
    orderNumber,
    status,
    paymentStatus,
    items,
    subtotal,
    discount,
    shipping,
    total,
    shippingAddress,
    createdAt,
    deliveredAt,
    tracking,
  } = order;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Order #{orderNumber}
            </h1>
            <p className="text-gray-500 mt-1">
              Placed on {formatDate(createdAt, 'long')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <StatusBadge status={paymentStatus === 'paid' ? 'paid' : 'unpaid'} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking */}
            {tracking?.number && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Tracking</h2>
                <p className="text-gray-600">
                  Courier: {tracking.courier}<br />
                  Tracking Number: {tracking.number}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Items</h2>
              <div className="divide-y">
                {items?.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <Link to={`/products/${item.product?.slug}`} className="font-medium hover:text-primary-600">
                        {item.product?.name}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-gray-500">
                          {item.variant.size} • {item.variant.color}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.price)}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
              <address className="not-italic text-gray-600">
                {shippingAddress?.name}<br />
                {shippingAddress?.line1}
                {shippingAddress?.line2 && <>, {shippingAddress.line2}</>}<br />
                {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.pincode}<br />
                Phone: {shippingAddress?.phone}
              </address>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {deliveredAt && (
                <p className="mt-4 text-sm text-green-600">
                  Delivered on {formatDate(deliveredAt, 'long')}
                </p>
              )}

              <div className="mt-6 space-y-2">
                <Button fullWidth variant="outline">
                  Need Help?
                </Button>
                {status === 'delivered' && (
                  <Link to={`/review/order/${id}`}>
                    <Button fullWidth>Write a Review</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
