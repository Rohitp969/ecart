import React from 'react'
import { NavLink } from 'react-router-dom'
import { ExternalLink, Inbox, LayoutDashboard, PackagePlus, PackageSearch, ShoppingBag, Users, X } from 'lucide-react'

const SECTIONS = [
  { title: 'Overview', links: [{ to: '/dashboard/sales', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Catalog',
    links: [
      { to: '/dashboard/products', label: 'Products', icon: PackageSearch },
      { to: '/dashboard/add-product', label: 'Add Product', icon: PackagePlus },
    ],
  },
  { title: 'Sales', links: [{ to: '/dashboard/orders', label: 'Orders', icon: ShoppingBag }] },
  {
    title: 'Customers',
    links: [
      { to: '/dashboard/users', label: 'Users', icon: Users },
      { to: '/dashboard/messages', label: 'Messages', icon: Inbox },
    ],
  },
]

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && <div className='fixed inset-0 z-40 bg-black/40 lg:hidden' onClick={onClose} />}
      {/* below lg a closed drawer is also invisible, so its links can't be tabbed to off-screen */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white transition-[transform,visibility] duration-300 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full max-lg:invisible'
        }`}
      >
        <div className='flex items-center justify-between px-5 py-3 lg:hidden'>
          <span className='font-bold text-gray-900'>Admin Panel</span>
          <button onClick={onClose} aria-label='Close menu' className='-mr-2 cursor-pointer rounded-lg p-2 hover:bg-gray-100'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <nav className='flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4 lg:py-6'>
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className='mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400'>{section.title}</p>
              <div className='space-y-1'>
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        isActive ? 'bg-pink-50 text-pink-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <link.icon className='h-5 w-5' />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className='border-t border-gray-100 p-4'>
          <NavLink
            to='/'
            className='flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          >
            <ExternalLink className='h-4 w-4' /> View Store
          </NavLink>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
