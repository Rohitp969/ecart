import React, { Suspense, useState } from 'react'
import { Outlet } from "react-router-dom";
import AdminTopbar from '../components/admin/AdminTopbar'
import Sidebar from '../components/Sidebar'
import PageLoader from '../components/PageLoader'

// Admin shell: own header + section sidebar (drawer on mobile) + the active admin page
const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className='min-h-screen bg-gray-50'>
      <AdminTopbar onMenuClick={() => setMenuOpen(true)} />
      <div className='flex pt-16'>
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className='min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8'>
          {/* each admin page is its own chunk; keep the shell visible while one loads */}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
