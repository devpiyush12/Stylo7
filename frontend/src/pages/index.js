// Pages Index
import { lazy, Suspense } from 'react';
import { PageLoader } from '../components/common/Loader';

// Lazy load pages for better performance
export const HomePage = lazy(() => import('./HomePage'));
export const ProductsPage = lazy(() => import('./ProductsPage'));
export const ProductDetailPage = lazy(() => import('./ProductDetailPage'));
export const CartPage = lazy(() => import('./CartPage'));
export const CheckoutPage = lazy(() => import('./CheckoutPage'));
export const OrdersPage = lazy(() => import('./OrdersPage'));
export const OrderDetailPage = lazy(() => import('./OrderDetailPage'));
export const LoginPage = lazy(() => import('./LoginPage'));
export const RegisterPage = lazy(() => import('./RegisterPage'));
export const ProfilePage = lazy(() => import('./ProfilePage'));

// Wrapper for lazy loaded components
export const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);
