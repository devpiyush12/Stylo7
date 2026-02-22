import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { withSuspense } from './pages';
import { MainLayout, AdminLayout } from './components/layout';
import { ToastContainer } from './components/common/Toast';
import {
  HomePage,
  ProductsPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  OrdersPage,
  OrderDetailPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
} from './pages';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route wrapper
const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <>
      {/* Toast notifications */}
      <ToastContainer />
      
      <Routes>
        {/* Main routes with layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={withSuspense(HomePage)} />
          <Route path="/products" element={withSuspense(ProductsPage)} />
          <Route path="/products/:slug" element={withSuspense(ProductDetailPage)} />
          <Route path="/cart" element={withSuspense(CartPage)} />
          
          {/* Protected routes */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              {withSuspense(CheckoutPage)}
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              {withSuspense(OrdersPage)}
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute>
              {withSuspense(OrderDetailPage)}
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              {withSuspense(ProfilePage)}
            </ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <div className="min-h-screen p-8"><h1>Wishlist</h1></div>
            </ProtectedRoute>
          } />
          
          {/* Auth routes */}
          <Route path="/login" element={withSuspense(LoginPage)} />
          <Route path="/register" element={withSuspense(RegisterPage)} />
          
          {/* Static pages */}
          <Route path="/about" element={<div className="min-h-screen p-8"><h1>About Us</h1></div>} />
          <Route path="/contact" element={<div className="min-h-screen p-8"><h1>Contact</h1></div>} />
          <Route path="/faq" element={<div className="min-h-screen p-8"><h1>FAQs</h1></div>} />
          <Route path="/shipping" element={<div className="min-h-screen p-8"><h1>Shipping Info</h1></div>} />
          <Route path="/returns" element={<div className="min-h-screen p-8"><h1>Returns & Exchange</h1></div>} />
          <Route path="/size-guide" element={<div className="min-h-screen p-8"><h1>Size Guide</h1></div>} />
          <Route path="/track-order" element={<div className="min-h-screen p-8"><h1>Track Order</h1></div>} />
          <Route path="/privacy" element={<div className="min-h-screen p-8"><h1>Privacy Policy</h1></div>} />
          <Route path="/terms" element={<div className="min-h-screen p-8"><h1>Terms of Service</h1></div>} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<div><h1>Admin Dashboard</h1></div>} />
          <Route path="products" element={<div><h1>Products</h1></div>} />
          <Route path="orders" element={<div><h1>Orders</h1></div>} />
          <Route path="customers" element={<div><h1>Customers</h1></div>} />
          <Route path="reviews" element={<div><h1>Reviews</h1></div>} />
          <Route path="coupons" element={<div><h1>Coupons</h1></div>} />
          <Route path="inventory" element={<div><h1>Inventory</h1></div>} />
          <Route path="settings" element={<div><h1>Settings</h1></div>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900">404</h1>
              <p className="text-gray-500 mt-2">Page not found</p>
              <a href="/" className="text-primary-600 hover:underline mt-4 inline-block">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;
