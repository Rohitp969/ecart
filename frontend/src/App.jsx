import React, { lazy } from 'react'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useParams
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
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
// admin: loaded on demand, so shoppers never download the admin panel (and its charts)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminSales = lazy(() => import('./pages/admin/AdminSales'));
const AdminProduct = lazy(() => import('./pages/admin/AdminProduct'));
const AddProduct = lazy(() => import('./pages/admin/AddProduct'));
const EditProduct = lazy(() => import('./pages/admin/EditProduct'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const UserInfo = lazy(() => import('./pages/admin/UserInfo'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminAccount = lazy(() => import('./pages/admin/AdminAccount'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const OrderInvoice = lazy(() => import('./pages/admin/OrderInvoice'));
import PageLoader from './components/PageLoader';

// old /dashboard links (bookmarks, emails) open the matching admin page
const LEGACY_ADMIN_PATHS = { sales: '', 'add-product': 'products/new', users: 'customers' }
const LegacyAdminRedirect = () => {
  const { '*': rest = '' } = useParams()
  const [section, ...more] = rest.split('/')
  let target = section in LEGACY_ADMIN_PATHS ? LEGACY_ADMIN_PATHS[section] : rest
  if (section === 'users' && more[0] === 'orders') target = `customers/${more[1] || ''}`
  else if (section === 'users' && more[0]) target = `customers/${more[0]}`
  return <Navigate to={`/admin/${target}`.replace(/\/+$/, '')} replace />
}

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
      // old verification links from before the 6-digit code: open the code screen instead
      { path: '/verify/:token', element: <Navigate to='/verify' replace /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/verify-otp', element: <VerifyOtp /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },

  // Admin panel: own header + sidebar, admins only (they sign in on the same /login page)
  { path: '/admin/login', element: <Navigate to='/login' replace /> },
  // printable invoice: no admin header / sidebar
  {
    path: '/admin/invoice/:orderId',
    errorElement: <RouteError />,
    element: (
      <ProtectedRoute adminOnly>
        <React.Suspense fallback={<PageLoader className='min-h-screen' />}>
          <OrderInvoice />
        </React.Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    errorElement: <RouteError />,
    element: (
      <ProtectedRoute adminOnly>
        <React.Suspense fallback={<PageLoader className='min-h-screen' />}>
          <Dashboard />
        </React.Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminSales /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'products', element: <AdminProduct /> },
      { path: 'products/new', element: <AddProduct /> },
      { path: 'products/:id/edit', element: <EditProduct /> },
      { path: 'customers', element: <AdminUsers /> },
      { path: 'customers/:id', element: <UserInfo /> },
      { path: 'messages', element: <AdminMessages /> },
      { path: 'coupons', element: <AdminCoupons /> },
      { path: 'banners', element: <AdminBanners /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'account', element: <AdminAccount /> },
      { path: '*', element: <Navigate to='/admin' replace /> },
    ],
  },
  { path: '/dashboard/*', element: <LegacyAdminRedirect /> },
])

const App = () => {
  return <RouterProvider router={router} />
}

export default App
