import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrders as fetchOrdersAction,
  fetchOrderById,
  createOrder as createOrderAction,
  cancelOrder as cancelOrderAction,
  trackOrder as trackOrderAction,
  clearCurrentOrder,
  selectOrders,
  selectCurrentOrder,
  selectOrdersPagination,
  selectOrdersLoading,
  selectOrderCreating,
  selectOrdersError
} from '../store/slices/ordersSlice';
import api from '../api';

export function useOrders() {
  const dispatch = useDispatch();
  
  const orders = useSelector(selectOrders);
  const order = useSelector(selectCurrentOrder);
  const pagination = useSelector(selectOrdersPagination);
  const loading = useSelector(selectOrdersLoading);
  const creating = useSelector(selectOrderCreating);
  const error = useSelector(selectOrdersError);

  const handleFetchOrders = useCallback(async (params = {}) => {
    const result = await dispatch(fetchOrdersAction(params)).unwrap();
    return { success: true, data: result };
  }, [dispatch]);

  const handleFetchOrder = useCallback(async (orderId) => {
    const result = await dispatch(fetchOrderById(orderId)).unwrap();
    return { success: true, order: result };
  }, [dispatch]);

  const handleCreateOrder = useCallback(async (orderData) => {
    try {
      const result = await dispatch(createOrderAction(orderData)).unwrap();
      return { success: true, order: result };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to create order' };
    }
  }, [dispatch]);

  const handleCancelOrder = useCallback(async (orderId, reason) => {
    const result = await dispatch(cancelOrderAction({ orderId, reason })).unwrap();
    return { success: true, order: result };
  }, [dispatch]);

  const handleTrackOrder = useCallback(async (orderId) => {
    const result = await dispatch(trackOrderAction(orderId)).unwrap();
    return { success: true, tracking: result };
  }, [dispatch]);

  const clearOrder = useCallback(() => {
    dispatch(clearCurrentOrder());
  }, [dispatch]);

  const getInvoiceUrl = useCallback((orderId) => {
    return `${api.defaults.baseURL}/orders/${orderId}/invoice`;
  }, []);

  const getOrdersByStatus = useCallback((status) => {
    return orders.filter(o => o.status === status);
  }, [orders]);

  const getRecentOrders = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
  }, [orders]);

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

    orders.forEach(o => {
      if (o.status === 'pending') stats.pending++;
      else if (o.status === 'processing') stats.processing++;
      else if (o.status === 'shipped') stats.shipped++;
      else if (o.status === 'delivered') stats.delivered++;
      else if (o.status === 'cancelled') stats.cancelled++;
      
      if (o.status !== 'cancelled') {
        stats.totalSpent += o.total;
      }
    });

    return stats;
  }, [orders]);

  return {
    orders,
    order,
    pagination,
    loading,
    creating,
    error,
    fetchOrders: handleFetchOrders,
    fetchOrder: handleFetchOrder,
    createOrder: handleCreateOrder,
    cancelOrder: handleCancelOrder,
    trackOrder: handleTrackOrder,
    clearOrder,
    getInvoiceUrl,
    getOrdersByStatus,
    getRecentOrders,
    getOrderStats
  };
}

export default useOrders;
