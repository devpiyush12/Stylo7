import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addToast,
  removeToast,
  clearToasts,
  openModal,
  closeModal,
  closeAllModals,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setLoading,
  selectToasts,
  selectModals,
  selectSidebarOpen,
  selectMobileMenuOpen,
  selectLoading,
  selectCurrentModal
} from '../store/slices/uiSlice';

/**
 * Custom hook for UI state management
 */
export function useUI() {
  const dispatch = useDispatch();
  
  const toasts = useSelector(selectToasts);
  const modals = useSelector(selectModals);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const loading = useSelector(selectLoading);

  // ========== Toast Methods ==========

  /**
   * Show a toast notification
   */
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    dispatch(addToast({ id, message, type, duration }));
    
    // Auto remove toast
    if (duration > 0) {
      setTimeout(() => {
        dispatch(removeToast(id));
      }, duration);
    }
    
    return id;
  }, [dispatch]);

  /**
   * Show success toast
   */
  const showSuccess = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  /**
   * Show error toast
   */
  const showError = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  /**
   * Show warning toast
   */
  const showWarning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  /**
   * Show info toast
   */
  const showInfo = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  /**
   * Remove a specific toast
   */
  const hideToast = useCallback((id) => {
    dispatch(removeToast(id));
  }, [dispatch]);

  /**
   * Clear all toasts
   */
  const hideAllToasts = useCallback(() => {
    dispatch(clearToasts());
  }, [dispatch]);

  // ========== Modal Methods ==========

  /**
   * Open a modal
   */
  const openModalById = useCallback((modalId, props = {}) => {
    dispatch(openModal({ id: modalId, props }));
  }, [dispatch]);

  /**
   * Close a specific modal
   */
  const closeModalById = useCallback((modalId) => {
    dispatch(closeModal(modalId));
  }, [dispatch]);

  /**
   * Close all modals
   */
  const closeAllModalsFn = useCallback(() => {
    dispatch(closeAllModals());
  }, [dispatch]);

  /**
   * Check if modal is open
   */
  const isModalOpen = useCallback((modalId) => {
    return modals.some(modal => modal.id === modalId);
  }, [modals]);

  /**
   * Get modal props
   */
  const getModalProps = useCallback((modalId) => {
    const modal = modals.find(m => m.id === modalId);
    return modal?.props || {};
  }, [modals]);

  // Common modals
  const confirm = useCallback((options) => {
    const modalId = `confirm-${Date.now()}`;
    return new Promise((resolve) => {
      dispatch(openModal({
        id: modalId,
        props: {
          ...options,
          onConfirm: () => {
            dispatch(closeModal(modalId));
            resolve(true);
          },
          onCancel: () => {
            dispatch(closeModal(modalId));
            resolve(false);
          }
        }
      }));
    });
  }, [dispatch]);

  const alert = useCallback((message, title = 'Alert') => {
    const modalId = `alert-${Date.now()}`;
    return new Promise((resolve) => {
      dispatch(openModal({
        id: modalId,
        props: {
          title,
          message,
          onConfirm: () => {
            dispatch(closeModal(modalId));
            resolve(true);
          }
        }
      }));
    });
  }, [dispatch]);

  // ========== Sidebar Methods ==========

  /**
   * Toggle sidebar
   */
  const toggleSidebarFn = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  /**
   * Set sidebar state
   */
  const setSidebarState = useCallback((open) => {
    dispatch(setSidebarOpen(open));
  }, [dispatch]);

  // ========== Mobile Menu Methods ==========

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenuFn = useCallback(() => {
    dispatch(toggleMobileMenu());
  }, [dispatch]);

  /**
   * Set mobile menu state
   */
  const setMobileMenuState = useCallback((open) => {
    dispatch(setMobileMenuOpen(open));
  }, [dispatch]);

  // ========== Loading Methods ==========

  /**
   * Set loading state
   */
  const setLoadingState = useCallback((isLoading) => {
    dispatch(setLoading(isLoading));
  }, [dispatch]);

  return {
    // Toast
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    hideAllToasts,
    
    // Modal
    modals,
    openModal: openModalById,
    closeModal: closeModalById,
    closeAllModals: closeAllModalsFn,
    isModalOpen,
    getModalProps,
    confirm,
    alert,
    
    // Sidebar
    sidebarOpen,
    toggleSidebar: toggleSidebarFn,
    setSidebarOpen: setSidebarState,
    
    // Mobile Menu
    mobileMenuOpen,
    toggleMobileMenu: toggleMobileMenuFn,
    setMobileMenuOpen: setMobileMenuState,
    
    // Loading
    loading,
    setLoading: setLoadingState
  };
}

export default useUI;
