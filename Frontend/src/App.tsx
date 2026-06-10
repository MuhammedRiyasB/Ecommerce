import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from './layouts/MainLayout';
import Home from './features/catalog/Home';
import ProductListPage from './features/catalog/ProductListPage';
import ProductDetailPage from './features/catalog/ProductDetailPage';
import CartPage from './features/cart/CartPage';
import CheckoutPage from './features/checkout/CheckoutPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import VerifyEmailPage from './features/auth/VerifyEmailPage';
import UserRoute from './features/auth/UserRoute';
import AccountPage from './features/account/AccountPage';
import OrdersPage from './features/orders/OrdersPage';
import OrderDetailPage from './features/orders/OrderDetailPage';
import WishlistPage from './features/wishlist/WishlistPage';
import AdminRoute from './features/admin/AdminRoute';
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboardPage from './features/admin/AdminDashboardPage';
import ProductManagementPage from './features/admin/ProductManagementPage';
import ProductFormPage from './features/admin/ProductFormPage';
import OrderManagementPage from './features/admin/OrderManagementPage';
import CategoryManagementPage from './features/admin/CategoryManagementPage';
import UserManagementPage from './features/admin/UserManagementPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<ProductListPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />

          <Route element={<UserRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<ProductManagementPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="orders" element={<OrderManagementPage />} />
            <Route path="categories" element={<CategoryManagementPage />} />
            <Route path="users" element={<UserManagementPage />} />
          </Route>
        </Route>

        <Route path="*" element={<MainLayout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={2500} newestOnTop />
    </>
  );
}

export default App;
