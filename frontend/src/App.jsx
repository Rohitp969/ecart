import React, { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider
} from "react-router-dom";
import StoreLayout from './components/layouts/StoreLayout';
import AuthLayout from './components/layouts/AuthLayout';
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute';
import RouteError from './pages/RouteError';
import NotFound from './pages/NotFound';
// store
import Home from './pages/Home';
import Products from './pages/Products';
import SingleProduct from './pages/SingleProduct';
import Cart from './pages/Cart';
import AddressForm from './pages/AddressForm';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
// help center (footer links)
import Contact from './pages/help/Contact';
import Faqs from './pages/help/Faqs';
import TrackOrder from './pages/help/TrackOrder';
import ShippingReturns from './pages/help/ShippingReturns';
import SizeGuide from './pages/help/SizeGuide';
import { PrivacyPolicy, TermsOfUse } from './pages/help/Legal';
// auth
import Signup from './pages/Signup';
import Login from './pages/Login';
import Verify from './pages/Verify';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
// admin: loaded on demand, so shoppers never download the admin panel (and its charts)
import PageLoader from './components/PageLoader';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminSales = lazy(() => import('./pages/admin/AdminSales'));
const AdminProduct = lazy(() => import('./pages/admin/AdminProduct'));
const AddProduct = lazy(() => import('./pages/admin/AddProduct'));
const EditProduct = lazy(() => import('./pages/admin/EditProduct'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const UserInfo = lazy(() => import('./pages/admin/UserInfo'));
const ShowUserOrders = lazy(() => import('./pages/admin/ShowUserOrders'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));

const router = createBrowserRouter([
  // Store: navbar + footer
  {
    element: <StoreLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/products', element: <Products /> },
      { path: '/products/:id', element: <SingleProduct /> },
      { path: '/contact', element: <Contact /> },
      { path: '/faqs', element: <Faqs /> },
      { path: '/track-order', element: <TrackOrder /> },
      { path: '/shipping-returns', element: <ShippingReturns /> },
      { path: '/size-guide', element: <SizeGuide /> },
      { path: '/privacy-policy', element: <PrivacyPolicy /> },
      { path: '/terms', element: <TermsOfUse /> },
      {
        // signed-in customers (and admins) only
        element: <ProtectedRoute />,
        children: [
          { path: '/cart', element: <Cart /> },
          { path: '/address', element: <AddressForm /> },
          { path: '/order-success', element: <OrderSuccess /> },
          { path: '/profile/:userId', element: <Profile /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },

  // Auth: logo header only
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      {
        // already signed in? go to your home (admin panel or store)
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/signup', element: <Signup /> },
        ],
      },
      { path: '/verify', element: <Verify /> },
      { path: '/verify/:token', element: <VerifyEmail /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/verify-otp', element: <VerifyOtp /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },

  // Admin panel: own header + sidebar, admins only
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute adminOnly>
        <Suspense fallback={<PageLoader className='min-h-screen' />}>
          <Dashboard />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to='sales' replace /> },
      { path: 'sales', element: <AdminSales /> },
      { path: 'products', element: <AdminProduct /> },
      { path: 'add-product', element: <AddProduct /> },
      { path: 'products/:id/edit', element: <EditProduct /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'users/:id', element: <UserInfo /> },
      { path: 'users/orders/:userId', element: <ShowUserOrders /> },
      { path: 'messages', element: <AdminMessages /> },
      { path: '*', element: <Navigate to='/dashboard/sales' replace /> },
    ],
  },
])

const App = () => {
  return <RouterProvider router={router} />
}

export default App
