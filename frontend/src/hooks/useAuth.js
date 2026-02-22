import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  login,
  logout,
  register,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  clearError,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError
} from '../store/slices/authSlice';

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

  const handleLogin = useCallback(async (email, password) => {
    const result = await dispatch(login({ email, password })).unwrap();
    return { success: true, user: result.user };
  }, [dispatch]);

  const handleRegister = useCallback(async (userData) => {
    const result = await dispatch(register(userData)).unwrap();
    return { success: true, user: result.user };
  }, [dispatch]);

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/');
  }, [dispatch, navigate]);

  const fetchProfile = useCallback(async () => {
    const result = await dispatch(getProfile()).unwrap();
    return { success: true, user: result };
  }, [dispatch]);

  const handleUpdateProfile = useCallback(async (updates) => {
    const result = await dispatch(updateProfile(updates)).unwrap();
    return { success: true, user: result };
  }, [dispatch]);

  const handleChangePassword = useCallback(async (currentPassword, newPassword) => {
    const result = await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
    return { success: true };
  }, [dispatch]);

  const handleForgotPassword = useCallback(async (email) => {
    const result = await dispatch(forgotPassword(email)).unwrap();
    return { success: true };
  }, [dispatch]);

  const handleResetPassword = useCallback(async (token, newPassword) => {
    const result = await dispatch(resetPassword({ token, newPassword })).unwrap();
    return { success: true };
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    fetchProfile,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    clearAuthError
  };
}

export default useAuth;
