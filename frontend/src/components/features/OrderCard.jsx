import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge, { StatusBadge } from '../common/Badge';
import Button from '../common/Button';

/**
 * OrderCard Component - Display order summary
 */
const OrderCard = ({ order, isAdmin = false, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="flex justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const {
    _id,
    orderNumber,
    status,
    paymentStatus,
    items,
    totalAmount,
    createdAt,
    shippingAddress,
  } = order;

  const itemCount = items?.length || 0;
  const totalQuantity = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm text-gray-500">Order</p>
            <Link
              to={`/orders/${_id}`}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              #{orderNumber}
            </Link>
          </div>
          <span className="text-gray-300">|</span>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-sm font-medium">
              {new Date(createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <StatusBadge status={paymentStatus === 'paid' ? 'paid' : 'unpaid'} />
        </div>
      </div>

      {/* Items preview */}
      <div className="p-4">
        <div className="flex flex-wrap gap-3">
          {items?.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <img
                src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                alt={item.product?.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {item.product?.name}
                </p>
                <p className="text-xs text-gray-500">
                  Qty: {item.quantity} • ₹{item.price?.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {itemCount > 3 && (
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg text-sm text-gray-500">
              +{itemCount - 3} more
            </div>
          )}
        </div>

        {/* Shipping address preview */}
        {isAdmin && shippingAddress && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Ship to: {shippingAddress.name}, {shippingAddress.city}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
        <div>
          <p className="text-sm text-gray-500">
            {totalQuantity} item{totalQuantity !== 1 ? 's' : ''}
          </p>
          <p className="font-semibold text-gray-900">
            Total: ₹{totalAmount?.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/orders/${_id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          {status === 'delivered' && (
            <Link to={`/review/order/${_id}`}>
              <Button variant="primary" size="sm">
                Write Review
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCard;
