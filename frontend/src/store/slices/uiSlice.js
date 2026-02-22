import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  toasts: [],
  isPageLoading: false,
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,
  modal: null, // { type: string, data: object }
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Toast notifications
    showToast: (state, action) => {
      const { message, type = 'success', duration = 5000 } = action.payload;
      state.toasts.push({
        id: Date.now(),
        message,
        type,
        duration,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },

    // Page loading
    setPageLoading: (state, action) => {
      state.isPageLoading = action.payload;
    },

    // Sidebar (admin)
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    // Mobile menu
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },

    // Search
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload;
    },

    // Modal
    openModal: (state, action) => {
      const { type, data } = action.payload;
      state.modal = { type, data: data || null };
    },
    closeModal: (state) => {
      state.modal = null;
    },
  },
});

export const {
  showToast,
  removeToast,
  clearToasts,
  setPageLoading,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleSearch,
  setSearchOpen,
  openModal,
  closeModal,
} = uiSlice.actions;

// Selectors
export const selectToasts = (state) => state.ui.toasts;
export const selectIsPageLoading = (state) => state.ui.isPageLoading;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectSearchOpen = (state) => state.ui.searchOpen;
export const selectModal = (state) => state.ui.modal;

export default uiSlice.reducer;
