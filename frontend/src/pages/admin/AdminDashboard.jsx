import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBagIcon, 
  UsersIcon, 
  CurrencyRupeeIcon,
  CubeIcon 
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const stats = [
    { 
      name: 'Total Orders', 
      value: '1,234', 
      icon: ShoppingBagIcon, 
      color: 'bg-blue-500',
      link: '/admin/orders'
    },
    { 
      name: 'Total Users', 
      value: '5,678', 
      icon: UsersIcon, 
      color: 'bg-green-500',
      link: '/admin/users'
    },
    { 
      name: 'Revenue', 
      value: '₹12,34,567', 
      icon: CurrencyRupeeIcon, 
      color: 'bg-purple-500',
      link: '/admin/orders'
    },
    { 
      name: 'Products', 
      value: '234', 
      icon: CubeIcon, 
      color: 'bg-orange-500',
      link: '/admin/products'
    },
  ];

  const recentOrders = [
    { id: 'ORD001', customer: 'John Doe', amount: '₹1,299', status: 'Delivered', date: '2026-02-22' },
    { id: 'ORD002', customer: 'Jane Smith', amount: '₹2,499', status: 'Processing', date: '2026-02-21' },
    { id: 'ORD003', customer: 'Mike Johnson', amount: '₹899', status: 'Shipped', date: '2026-02-21' },
    { id: 'ORD004', customer: 'Sarah Wilson', amount: '₹1,599', status: 'Pending', date: '2026-02-20' },
    { id: 'ORD005', customer: 'Tom Brown', amount: '₹3,299', status: 'Delivered', date: '2026-02-20' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Processing': 'bg-blue-100 text-blue-800',
      'Shipped': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link 
            to="/admin/orders" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
