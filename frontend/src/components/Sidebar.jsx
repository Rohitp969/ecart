import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Images, Inbox, LayoutDashboard, PackagePlus, PackageSearch, Settings, ShoppingBag, TicketPercent, UserCog, Users, X } from 'lucide-react'
import { useAdminAlerts } from '@/lib/adminAlerts'

// badge: key in the admin alerts (orders to ship, new messages) shown as a count next to the link
const SECTIONS = [
  { title: 'Overview', links: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'Catalog',
    links: [
      { to: '/admin/products', label: 'Products', icon: PackageSearch },
      { to: '/admin/products/new', label: 'Add Product', icon: PackagePlus },
    ],
  },
  {
    title: 'Sales',
    links: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: 'toShip' },
      { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
    ],
  },
  {
    title: 'Customers',
    links: [
      { to: '/admin/customers', label: 'Users', icon: Users },
      { to: '/admin/messages', label: 'Messages', icon: Inbox, badge: 'newMessages' },
    ],
  },
  {
    title: 'Store',
    links: [
      { to: '/admin/banners', label: 'Banners', icon: Images },
      { to: '/admin/settings', label: 'Store Settings', icon: Settings },
    ],
  },
  { title: 'My account', links: [{ to: '/admin/account', label: 'Profile & password', icon: UserCog }] },
]

const Sidebar = ({ open, onClose }) => {
  const { alerts } = useAdminAlerts()
  const { pathname } = useLocation()
  // Products stays highlighted on the product list and edit pages, but not on Add Product
  const onProductPage = pathname.startsWith('/admin/products') && pathname !== '/admin/products/new'

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

        <nav className='flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4 lg:py-5'>
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className='mb-1.5 px-3 text-xs font-bold uppercase tracking-wider text-gray-400'>{section.title}</p>
              <div className='space-y-0.5'>
                {section.links.map((link) => {
                  const count = link.badge ? alerts?.[link.badge] : 0
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          (link.to === '/admin/products' ? onProductPage : isActive)
                            ? 'bg-pink-50 text-pink-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <link.icon className='h-5 w-5' />
                      <span className='flex-1'>{link.label}</span>
                      {count > 0 && (
                        <span className='rounded-full bg-pink-600 px-1.5 text-xs font-bold text-white' aria-label={`${count} waiting`}>
                          {count}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        {/* "View store" lives in the top bar (and its profile menu on phones) */}
      </aside>
    </>
  )
}

export default Sidebar
