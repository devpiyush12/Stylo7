import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../store/slices/ordersSlice';
import { OrderCard } from '../components/features';
import { PageLoader } from '../components/common/Loader';
import Button from '../components/common/Button';

/**
 * OrdersPage - User's order history
 */
const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders?.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
            <Link to="/products">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
