import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  fetchOrderStart,
  fetchOrderSuccess,
  fetchOrderFailure,
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  cancelOrderStart,
  cancelOrderSuccess,
  cancelOrderFailure,
  selectOrders,
  selectOrder,
  selectOrdersPagination,
  selectOrdersLoading,
  selectOrdersError
} from '../store/slices/ordersSlice';
import api from '../api';

/**
 * Custom hook for orders operations
 */
export function useOrders() {
  const dispatch = useDispatch();
  
  const orders = useSelector(selectOrders);
  const order = useSelector(selectOrder);
  const pagination = useSelector(selectOrdersPagination);
  const loading = useSelector(selectOrdersLoading);
  const error = useSelector(selectOrdersError);

  /**
   * Fetch user's orders
   */
  const fetchOrders = useCallback(async (params = {}) => {
    try {
      dispatch(fetchOrdersStart());
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', params.page);
      if (params.limit) queryParams.set('limit', params.limit);
      if (params.status) queryParams.set('status', params.status);

      const { data } = await api.get(`/orders?${queryParams.toString()}`);
      dispatch(fetchOrdersSuccess(data.data));
      
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch orders';
      dispatch(fetchOrdersFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Fetch single order by ID
   */
  const fetchOrder = useCallback(async (orderId) => {
    try {
      dispatch(fetchOrderStart());
      const { data } = await api.get(`/orders/${orderId}`);
      dispatch(fetchOrderSuccess(data.data));
      return { success: true, order: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch order';
      dispatch(fetchOrderFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Create new order
   */
  const createOrder = useCallback(async (orderData) => {
    try {
      dispatch(createOrderStart());
      const { data } = await api.post('/orders', orderData);
      dispatch(createOrderSuccess(data.data));
      return { success: true, order: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create order';
      dispatch(createOrderFailure(message));
      return { success: false, error: message, errors: err.response?.data?.errors };
    }
  }, [dispatch]);

  /**
   * Cancel order
   */
  const cancelOrder = useCallback(async (orderId, reason) => {
    try {
      dispatch(cancelOrderStart());
      const { data } = await api.post(`/orders/${orderId}/cancel`, { reason });
      dispatch(cancelOrderSuccess(data.data));
      return { success: true, order: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel order';
      dispatch(cancelOrderFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Get order invoice PDF URL
   */
  const getInvoiceUrl = useCallback((orderId) => {
    return `${api.defaults.baseURL}/orders/${orderId}/invoice`;
  }, []);

  /**
   * Track order status
   */
  const trackOrder = useCallback(async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}/track`);
      return { success: true, tracking: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to track order';
      return { success: false, error: message };
    }
  }, []);

  /**
   * Get orders by status
   */
  const getOrdersByStatus = useCallback((status) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  /**
   * Get recent orders (last 30 days)
   */
  const getRecentOrders = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return orders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo);
  }, [orders]);

  /**
   * Calculate order statistics
   */
  const getOrderStats = useCallback(() => {
    const stats = {
      total: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalSpent: 0
    };

    orders.forEach(order => {
      if (order.status === 'pending') stats.pending++;
      else if (order.status === 'processing') stats.processing++;
      else if (order.status === 'shipped') stats.shipped++;
      else if (order.status === 'delivered') stats.delivered++;
      else if (order.status === 'cancelled') stats.cancelled++;
      
      if (order.status !== 'cancelled') {
        stats.totalSpent += order.total;
      }
    });

    return stats;
  }, [orders]);

  return {
    orders,
    order,
    pagination,
    loading,
    error,
    fetchOrders,
    fetchOrder,
    createOrder,
    cancelOrder,
    getInvoiceUrl,
    trackOrder,
    getOrdersByStatus,
    getRecentOrders,
    getOrderStats
  };
}

export default useOrders;
