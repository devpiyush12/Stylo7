import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addToast,
  removeToast,
  clearToasts,
  openModal,
  closeModal,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setPageLoading,
  selectToasts,
  selectModal,
  selectSidebarOpen,
  selectMobileMenuOpen,
  selectIsPageLoading
} from '../store/slices/uiSlice';

export function useUI() {
  const dispatch = useDispatch();
  
  const toasts = useSelector(selectToasts);
  const modal = useSelector(selectModal);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const loading = useSelector(selectIsPageLoading);

  // Toast methods
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    dispatch(addToast({ id, message, type, duration }));
    
    if (duration > 0) {
      setTimeout(() => {
        dispatch(removeToast(id));
      }, duration);
    }
    
    return id;
  }, [dispatch]);

  const showSuccess = useCallback((message, duration) => showToast(message, 'success', duration), [showToast]);
  const showError = useCallback((message, duration) => showToast(message, 'error', duration), [showToast]);
  const showWarning = useCallback((message, duration) => showToast(message, 'warning', duration), [showToast]);
  const showInfo = useCallback((message, duration) => showToast(message, 'info', duration), [showToast]);
  const hideToast = useCallback((id) => dispatch(removeToast(id)), [dispatch]);
  const hideAllToasts = useCallback(() => dispatch(clearToasts()), [dispatch]);

  // Modal methods
  const openModalById = useCallback((modalId, props = {}) => {
    dispatch(openModal({ id: modalId, props }));
  }, [dispatch]);

  const closeModalById = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const isModalOpen = useCallback((modalId) => modal?.id === modalId, [modal]);
  const getModalProps = useCallback(() => modal?.props || {}, [modal]);

  // Sidebar methods
  const toggleSidebarFn = useCallback(() => dispatch(toggleSidebar()), [dispatch]);
  const setSidebarState = useCallback((open) => dispatch(setSidebarOpen(open)), [dispatch]);

  // Mobile menu methods
  const toggleMobileMenuFn = useCallback(() => dispatch(toggleMobileMenu()), [dispatch]);
  const setMobileMenuState = useCallback((open) => dispatch(setMobileMenuOpen(open)), [dispatch]);

  // Loading methods
  const setLoadingState = useCallback((isLoading) => dispatch(setPageLoading(isLoading)), [dispatch]);

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
    modal,
    openModal: openModalById,
    closeModal: closeModalById,
    isModalOpen,
    getModalProps,
    
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
