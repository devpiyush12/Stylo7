import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  fetchProductStart,
  fetchProductSuccess,
  fetchProductFailure,
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
  fetchFeaturedStart,
  fetchFeaturedSuccess,
  fetchFeaturedFailure,
  setSearchQuery,
  setFilters,
  clearFilters,
  setSortBy,
  setPage,
  selectProducts,
  selectProduct,
  selectCategories,
  selectFeatured,
  selectPagination,
  selectFilters,
  selectSearchQuery,
  selectSortBy,
  selectProductsLoading,
  selectProductsError
} from '../store/slices/productsSlice';
import api from '../api';

/**
 * Custom hook for products operations
 */
export function useProducts() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selectors
  const products = useSelector(selectProducts);
  const product = useSelector(selectProduct);
  const categories = useSelector(selectCategories);
  const featured = useSelector(selectFeatured);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const searchQuery = useSelector(selectSearchQuery);
  const sortBy = useSelector(selectSortBy);
  const loading = useSelector(selectProductsLoading);
  const error = useSelector(selectProductsError);

  /**
   * Fetch products list with filters
   */
  const fetchProducts = useCallback(async (params = {}) => {
    try {
      dispatch(fetchProductsStart());
      
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (params.search || searchQuery) {
        queryParams.set('search', params.search || searchQuery);
      }
      if (params.category || filters.category) {
        queryParams.set('category', params.category || filters.category);
      }
      if (params.minPrice || filters.minPrice) {
        queryParams.set('minPrice', params.minPrice || filters.minPrice);
      }
      if (params.maxPrice || filters.maxPrice) {
        queryParams.set('maxPrice', params.maxPrice || filters.maxPrice);
      }
      if (params.inStock !== undefined ? params.inStock : filters.inStock) {
        queryParams.set('inStock', 'true');
      }
      if (params.sort || sortBy) {
        queryParams.set('sort', params.sort || sortBy);
      }
      if (params.page) {
        queryParams.set('page', params.page);
      }
      if (params.limit) {
        queryParams.set('limit', params.limit);
      }
      
      // Size and color filters
      if (filters.sizes?.length) {
        queryParams.set('sizes', filters.sizes.join(','));
      }
      if (filters.colors?.length) {
        queryParams.set('colors', filters.colors.join(','));
      }

      const { data } = await api.get(`/products?${queryParams.toString()}`);
      dispatch(fetchProductsSuccess(data.data));
      
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch products';
      dispatch(fetchProductsFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch, searchQuery, filters, sortBy]);

  /**
   * Fetch single product by ID or slug
   */
  const fetchProduct = useCallback(async (id) => {
    try {
      dispatch(fetchProductStart());
      const { data } = await api.get(`/products/${id}`);
      dispatch(fetchProductSuccess(data.data));
      return { success: true, product: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch product';
      dispatch(fetchProductFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Fetch categories
   */
  const fetchCategories = useCallback(async () => {
    try {
      dispatch(fetchCategoriesStart());
      const { data } = await api.get('/products/categories');
      dispatch(fetchCategoriesSuccess(data.data));
      return { success: true, categories: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch categories';
      dispatch(fetchCategoriesFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Fetch featured products
   */
  const fetchFeatured = useCallback(async () => {
    try {
      dispatch(fetchFeaturedStart());
      const { data } = await api.get('/products/featured');
      dispatch(fetchFeaturedSuccess(data.data));
      return { success: true, featured: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch featured products';
      dispatch(fetchFeaturedFailure(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  /**
   * Search products
   */
  const searchProducts = useCallback((query) => {
    dispatch(setSearchQuery(query));
  }, [dispatch]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  /**
   * Clear all filters
   */
  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  /**
   * Change sort order
   */
  const changeSort = useCallback((sort) => {
    dispatch(setSortBy(sort));
  }, [dispatch]);

  /**
   * Change page
   */
  const changePage = useCallback((page) => {
    dispatch(setPage(page));
  }, [dispatch]);

  /**
   * Sync filters with URL params
   */
  const syncWithUrl = useCallback(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const urlFilters = {};
    if (category) urlFilters.category = category;
    if (minPrice) urlFilters.minPrice = Number(minPrice);
    if (maxPrice) urlFilters.maxPrice = Number(maxPrice);

    if (Object.keys(urlFilters).length > 0) {
      dispatch(setFilters(urlFilters));
    }
    if (search) {
      dispatch(setSearchQuery(search));
    }
    if (sort) {
      dispatch(setSortBy(sort));
    }
  }, [dispatch, searchParams]);

  /**
   * Update URL with current filters
   */
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (sortBy) params.set('sort', sortBy);
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, filters, sortBy, setSearchParams]);

  return {
    products,
    product,
    categories,
    featured,
    pagination,
    filters,
    searchQuery,
    sortBy,
    loading,
    error,
    fetchProducts,
    fetchProduct,
    fetchCategories,
    fetchFeatured,
    searchProducts,
    updateFilters,
    resetFilters,
    changeSort,
    changePage,
    syncWithUrl,
    updateUrl
  };
}

export default useProducts;
