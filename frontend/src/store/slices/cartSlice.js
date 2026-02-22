import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPut, apiDelete } from '../../api';

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiGet('/cart');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, variantId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await apiPost('/cart/items', { productId, variantId, quantity });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await apiPut(`/cart/items/${itemId}`, { quantity });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await apiDelete(`/cart/items/${itemId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const response = await apiPost('/cart/coupon', { code });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDelete('/cart/coupon');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiDelete('/cart');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  items: [],
  coupon: null,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
};

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    updateCartCount: (state) => {
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        const cart = action.payload;
        state.items = cart.items || [];
        state.coupon = cart.coupon || null;
        state.subtotal = cart.subtotal || 0;
        state.discount = cart.discount || 0;
        state.shipping = cart.shipping || 0;
        state.tax = cart.tax || 0;
        state.total = cart.total || 0;
        state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        const cart = action.payload;
        state.items = cart.items || [];
        state.subtotal = cart.subtotal || 0;
        state.total = cart.total || 0;
        state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const cart = action.payload;
        state.items = cart.items || [];
        state.subtotal = cart.subtotal || 0;
        state.total = cart.total || 0;
        state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      })
      // Remove cart item
      .addCase(removeCartItem.fulfilled, (state, action) => {
        const cart = action.payload;
        state.items = cart.items || [];
        state.coupon = cart.coupon || null;
        state.subtotal = cart.subtotal || 0;
        state.discount = cart.discount || 0;
        state.total = cart.total || 0;
        state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      })
      // Apply coupon
      .addCase(applyCoupon.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        const cart = action.payload;
        state.coupon = cart.coupon;
        state.discount = cart.discount || 0;
        state.total = cart.total || 0;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove coupon
      .addCase(removeCoupon.fulfilled, (state, action) => {
        const cart = action.payload;
        state.coupon = null;
        state.discount = 0;
        state.total = cart.total || 0;
      })
      // Clear cart
      .addCase(clearCart.fulfilled, () => initialState);
  },
});

export const { clearCartError, updateCartCount } = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;

export default cartSlice.reducer;
