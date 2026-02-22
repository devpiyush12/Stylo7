import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchProducts,
  fetchProductById,
  fetchFeaturedProducts,
  fetchCategories,
  searchProducts as searchProductsAction,
  setFilters,
  clearFilters,
  setSortBy,
  setPage,
  selectProducts,
  selectCurrentProduct,
  selectFeaturedProducts,
  selectCategories,
  selectSearchResults,
  selectProductsPagination,
  selectProductsFilters,
  selectProductsLoading,
  selectProductsError
} from '../store/slices/productsSlice';

export function useProducts() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const products = useSelector(selectProducts);
  const product = useSelector(selectCurrentProduct);
  const categories = useSelector(selectCategories);
  const featured = useSelector(selectFeaturedProducts);
  const searchResults = useSelector(selectSearchResults);
  const pagination = useSelector(selectProductsPagination);
  const filters = useSelector(selectProductsFilters);
  const loading = useSelector(selectProductsLoading);
  const error = useSelector(selectProductsError);

  const handleFetchProducts = useCallback(async (params = {}) => {
    const queryParams = {};
    
    if (params.search) queryParams.search = params.search;
    if (params.category || filters.category) queryParams.category = params.category || filters.category;
    if (params.minPrice || filters.minPrice) queryParams.minPrice = params.minPrice || filters.minPrice;
    if (params.maxPrice || filters.maxPrice) queryParams.maxPrice = params.maxPrice || filters.maxPrice;
    if (params.sort) queryParams.sort = params.sort;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    const result = await dispatch(fetchProducts(queryParams)).unwrap();
    return { success: true, data: result };
  }, [dispatch, filters]);

  const handleFetchProduct = useCallback(async (id) => {
    const result = await dispatch(fetchProductById(id)).unwrap();
    return { success: true, product: result };
  }, [dispatch]);

  const handleFetchCategories = useCallback(async () => {
    const result = await dispatch(fetchCategories()).unwrap();
    return { success: true, categories: result };
  }, [dispatch]);

  const handleFetchFeatured = useCallback(async () => {
    const result = await dispatch(fetchFeaturedProducts()).unwrap();
    return { success: true, featured: result };
  }, [dispatch]);

  const handleSearchProducts = useCallback(async (query) => {
    const result = await dispatch(searchProductsAction(query)).unwrap();
    return { success: true, results: result };
  }, [dispatch]);

  const updateFilters = useCallback((newFilters) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const changeSort = useCallback((sort) => {
    dispatch(setSortBy(sort));
  }, [dispatch]);

  const changePage = useCallback((page) => {
    dispatch(setPage(page));
  }, [dispatch]);

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
  }, [dispatch, searchParams]);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  return {
    products,
    product,
    categories,
    featured,
    searchResults,
    pagination,
    filters,
    loading,
    error,
    fetchProducts: handleFetchProducts,
    fetchProduct: handleFetchProduct,
    fetchCategories: handleFetchCategories,
    fetchFeatured: handleFetchFeatured,
    searchProducts: handleSearchProducts,
    updateFilters,
    resetFilters,
    changeSort,
    changePage,
    syncWithUrl,
    updateUrl
  };
}

export default useProducts;
