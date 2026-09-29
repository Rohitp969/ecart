import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import StoreLayout from './layouts/StoreLayout'
import AccessDenied from '../pages/AccessDenied'
import { isAdmin, redirectAfterLogin } from '../lib/auth'

// Pages that need a login. Guests go to /login and come back here afterwards.
// adminOnly: customers see an "Admins only" page instead of silently landing on home.
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useSelector((store) => store.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to='/login' replace state={{ from: location.pathname + location.search }} />
  }

  if (adminOnly && !isAdmin(user)) {
    return (
      <StoreLayout>
        <AccessDenied />
      </StoreLayout>
    )
  }

  return children ?? <Outlet />
}

// Login / signup pages: signed-in users are sent on. Uses the same target as the login
// form (page they came from, else their home), so the two redirects never disagree.
export const GuestRoute = ({ children }) => {
  const { user } = useSelector((store) => store.user)
  const location = useLocation()
  if (user) return <Navigate to={redirectAfterLogin(user, location.state?.from)} replace />
  return children ?? <Outlet />
}

export default ProtectedRoute
