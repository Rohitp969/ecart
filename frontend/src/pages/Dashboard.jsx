import React, { Suspense, useEffect, useState } from 'react'
import { Outlet } from "react-router-dom";
import AdminTopbar from '../components/admin/AdminTopbar'
import AdminAlertsProvider from '../components/admin/AdminAlerts'
import CommandMenu from '../components/admin/CommandMenu'
import Sidebar from '../components/Sidebar'
import PageLoader from '../components/PageLoader'

// Admin shell: own header + section sidebar (drawer on mobile) + the active admin page
const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Ctrl/⌘ K opens "jump to" from anywhere in the admin panel
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AdminAlertsProvider>
      <div className='min-h-screen bg-gray-50'>
        <AdminTopbar onMenuClick={() => setMenuOpen(true)} onSearchClick={() => setSearchOpen(true)} />
        <div className='flex pt-16'>
          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
          <main className='min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8'>
            {/* each admin page is its own chunk; keep the shell visible while one loads */}
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </AdminAlertsProvider>
  )
}

export default Dashboard
