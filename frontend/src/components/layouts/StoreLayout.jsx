import React, { useEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import Navbar from '../Navbar'
import Footer from '../Footer'

// Customer-facing pages: store navbar on top, footer at the bottom
const StoreLayout = ({ children }) => {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  // open new pages at the top (e.g. from a footer link); back/forward keeps the browser's position
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return (
    <div className='flex min-h-screen flex-col'>
      <Navbar />
      <div className='flex-1'>{children ?? <Outlet />}</div>
      <Footer />
    </div>
  )
}

export default StoreLayout
