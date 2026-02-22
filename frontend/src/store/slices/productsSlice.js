import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../../api';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiGet('/products', params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiGet(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiGet('/products/featured');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiGet('/products/categories');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query, { rejectWithValue }) => {
    try {
      const response = await apiGet('/products/search', { q: query });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  categories: [],
  searchResults: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  filters: {
    category: null,
    minPrice: null,
    maxPrice: null,
    sizes: [],
    colors: [],
    sortBy: 'newest',
    search: '',
  },
  isLoading: false,
  isLoadingMore: false,
  error: null,
};

// Slice
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state, action) => {
        const page = action.meta.arg?.page || 1;
        if (page > 1) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        const { products, pagination } = action.payload;
        if (pagination.page > 1) {
          state.products = [...state.products, ...products];
        } else {
          state.products = products;
        }
        state.pagination = pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload;
      })
      // Fetch single product
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch featured products
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      })
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearCurrentProduct,
  clearSearchResults,
  setPage,
} = productsSlice.actions;

// Selectors
export const selectProducts = (state) => state.products.products;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectFeaturedProducts = (state) => state.products.featuredProducts;
export const selectCategories = (state) => state.products.categories;
export const selectSearchResults = (state) => state.products.searchResults;
export const selectProductsPagination = (state) => state.products.pagination;
export const selectProductsFilters = (state) => state.products.filters;
export const selectProductsLoading = (state) => state.products.isLoading;
export const selectProductsError = (state) => state.products.error;

export default productsSlice.reducer;
