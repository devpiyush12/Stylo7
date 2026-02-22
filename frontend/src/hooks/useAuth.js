import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  registerStart,
  registerSuccess,
  registerFailure,
  getProfileStart,
  getProfileSuccess,
  getProfileFailure,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
  changePasswordStart,
  changePasswordSuccess,
  changePasswordFailure,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordStart,
  resetPasswordSuccess,
  resetPasswordFailure,
  clearError,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError
} from '../store/slices/authSlice';
import api from '../api';

/**
 * Custom hook for authentication operations
 */
export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // Check auth status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      fetchProfile();
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    try {
      dispatch(loginStart());
      const { data } = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      dispatch(loginSuccess(data.data.user));
      return { success: true, user: data.data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      dispatch(loginFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    try {
      dispatch(registerStart());
      const { data } = await api.post('/auth/register', userData);
      
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      dispatch(registerSuccess(data.data.user));
      return { success: true, user: data.data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      dispatch(registerFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      dispatch(logoutAction());
      navigate('/');
    }
  }, [dispatch, navigate]);

  /**
   * Fetch current user profile
   */
  const fetchProfile = useCallback(async () => {
    try {
      dispatch(getProfileStart());
      const { data } = await api.get('/users/profile');
      dispatch(getProfileSuccess(data.data));
      return { success: true, user: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch profile';
      dispatch(getProfileFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      dispatch(updateProfileStart());
      const { data } = await api.put('/users/profile', updates);
      dispatch(updateProfileSuccess(data.data));
      return { success: true, user: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      dispatch(updateProfileFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      dispatch(changePasswordStart());
      const { data } = await api.put('/users/password', { currentPassword, newPassword });
      dispatch(changePasswordSuccess());
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to change password';
      dispatch(changePasswordFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Request password reset email
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      dispatch(forgotPasswordStart());
      const { data } = await api.post('/auth/forgot-password', { email });
      dispatch(forgotPasswordSuccess());
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset email';
      dispatch(forgotPasswordFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      dispatch(resetPasswordStart());
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      dispatch(resetPasswordSuccess());
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password';
      dispatch(resetPasswordFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Clear auth error
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearAuthError
  };
}

export default useAuth;
