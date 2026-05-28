import { ShoppingCart, Menu, X, User, LogOut, Home, Package, LayoutDashboard, ChevronDown } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import axios from 'axios'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from '../redux/userSlice'

const Navbar = () => {
  const { user } = useSelector(store => store.user)
  const { cart } = useSelector(store => store.product)
  const accessToken = localStorage.getItem('accessToken')
  const admin = user?.role === "admin"
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const LogoutHandler = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/logout`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      if (res.data.success) {
        dispatch(setUser(null))
        toast.success(res.data.message)
        navigate('/')
        setIsMobileMenuOpen(false)
      }
    } catch (error) {
      console.log(error);
      toast.error('Logout failed')
    }
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [location])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isUserMenuOpen && !e.target.closest('.user-menu')) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isUserMenuOpen])

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Products', icon: Package },
    ...(admin ? [{ to: '/dashboard/sales', label: 'Dashboard', icon: LayoutDashboard }] : [])
  ]

  return (
    <>
      <header className={`
        fixed w-full z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
          : 'bg-white border-b border-gray-100'
        }
      `}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16 md:h-20'>
            
            {/* Logo Section */}
            <Link to='/' className='flex items-center space-x-2 group'>
              <div className='relative'>
                <img 
                  src='/Ekart-logo.png' 
                  alt='Ekart Logo' 
                  className='w-[100px] md:w-[120px] transition-transform duration-300 group-hover:scale-105'
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className='hidden md:flex items-center space-x-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    flex items-center gap-2 group
                    ${location.pathname === link.to
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <link.icon className='w-4 h-4 transition-transform duration-300 group-hover:scale-110' />
                  <span>{link.label}</span>
                  {location.pathname === link.to && (
                    <span className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full' />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className='flex items-center space-x-3 md:space-x-4'>
              
              {/* Cart Button */}
              <Link 
                to='/cart' 
                className='relative group'
              >
                <div className='p-2 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-all duration-300'>
                  <ShoppingCart className='w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform duration-300' />
                </div>
                {(cart?.items?.length > 0) && (
                  <span className='absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg animate-pulse'>
                    {cart?.items?.length}
                  </span>
                )}
              </Link>

              {/* User Section - Desktop */}
              <div className='hidden md:block user-menu relative'>
                {user ? (
                  <div>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className='flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-50 transition-all duration-300 group'
                    >
                      <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:scale-105 transition-transform'>
                        {user.firstName?.charAt(0).toUpperCase()}
                        {user.lastName?.charAt(0).toUpperCase()}
                      </div>
                      <div className='text-left hidden lg:block'>
                        <p className='text-sm font-medium text-gray-700'>{user.firstName}</p>
                        <p className='text-xs text-gray-500'>{user.role === 'admin' ? 'Administrator' : 'Customer'}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <div className='absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slideDown'>
                        <div className='p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white'>
                          <p className='font-semibold text-gray-900'>{user.firstName} {user.lastName}</p>
                          <p className='text-sm text-gray-500 mt-1'>{user.email}</p>
                        </div>
                        <div className='p-2'>
                          <Link 
                            to={`/profile/${user._id}`}
                            className='flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-300'
                          >
                            <User className='w-4 h-4 text-gray-500' />
                            <span className='text-sm text-gray-700'>My Profile</span>
                          </Link>
                          <button 
                            onClick={LogoutHandler}
                            className='w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-red-50 transition-all duration-300 group'
                          >
                            <LogOut className='w-4 h-4 text-red-500 group-hover:text-red-600' />
                            <span className='text-sm text-red-600 group-hover:text-red-700'>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button 
                    onClick={() => navigate('/login')} 
                    className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105'
                  >
                    Sign In
                  </Button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className='md:hidden p-2 rounded-xl hover:bg-gray-100 transition-all duration-300'
              >
                {isMobileMenuOpen ? (
                  <X className='w-6 h-6 text-gray-700' />
                ) : (
                  <Menu className='w-6 h-6 text-gray-700' />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`
          md:hidden fixed inset-x-0 top-16 bg-white shadow-xl transition-all duration-300 overflow-hidden z-40
          ${isMobileMenuOpen ? 'max-h-screen border-t border-gray-100' : 'max-h-0'}
        `}>
          <div className='px-4 py-4 space-y-3'>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${location.pathname === link.to
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <link.icon className='w-5 h-5' />
                <span className='font-medium'>{link.label}</span>
              </Link>
            ))}
            
            {user && (
              <>
                <div className='h-px bg-gray-100 my-2' />
                <Link
                  to={`/profile/${user._id}`}
                  className='flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-300'
                >
                  <User className='w-5 h-5' />
                  <span className='font-medium'>My Profile</span>
                </Link>
              </>
            )}
            
            <div className='pt-2'>
              {user ? (
                <Button 
                  onClick={LogoutHandler}
                  className='w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md'
                >
                  Logout
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/login')}
                  className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md'
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add this to your global CSS file */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default Navbar