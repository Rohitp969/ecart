import {
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  Home,
  Package,
  LayoutDashboard,
  ChevronDown,
  Search,
  ShoppingBag,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useSelector } from "react-redux";
import useLogout from "../hooks/useLogout";
import { isAdmin } from "../lib/auth";

const Navbar = () => {
  const { user } = useSelector((store) => store.user);
  const { cart } = useSelector((store) => store.product);
  const admin = isAdmin(user);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  // Close menus on route change (state adjusted during render, no effect needed)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }

  const LogoutHandler = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  // remember the current page so login can bring the shopper back here
  const goToLogin = () => navigate("/login", { state: { from: location.pathname + location.search } });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isUserMenuOpen && !e.target.closest(".user-menu")) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isUserMenuOpen]);

  // Uncontrolled input keyed by the URL query, so it follows /products?q=... (and clears with it)
  const urlQuery = new URLSearchParams(location.search).get("q") || "";
  const submitSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q").trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setIsMobileMenuOpen(false);
  };
  // called as a function (not a component) so re-renders don't remount the input mid-typing
  const searchForm = (className, inputId) => (
    <form onSubmit={submitSearch} className={`relative ${className}`} role="search">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        key={urlQuery}
        id={inputId}
        name="q"
        defaultValue={urlQuery}
        aria-label="Search products"
        placeholder="Search for products, brands and more"
        className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100"
      />
    </form>
  );

  // phones: open the menu with its search box focused (in the same tap, so the keyboard opens)
  const openMobileSearch = () => {
    setIsMobileMenuOpen(true);
    document.getElementById("mobile-search")?.focus({ preventScroll: true });
  };

  // a link stays active across its whole section (/products/123, /dashboard/orders…)
  const isActiveLink = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(`/${to.split("/")[1]}`);

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/products", label: "Products", icon: Package },
    ...(admin
      ? [{ to: "/dashboard", label: "Admin Panel", icon: LayoutDashboard }]
      : []),
  ];

  return (
    <>
      <header
        className={`
        fixed w-full z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100"
            : "bg-white border-b border-gray-100"
        }
      `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo Section */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <img
                  src="/Ekart-logo.png"
                  alt="Ekart Logo"
                  className="w-25 md:w-30 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>

            {/* Search - tablets & up (phones get it in the menu) */}
            {searchForm("mx-4 hidden min-w-0 max-w-xl flex-1 md:block lg:mx-6")}

            {/* Desktop Navigation - icons only on tablets to leave room for search */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-label={link.label}
                  title={link.label}
                  className={`
                    relative px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    flex items-center gap-2 group whitespace-nowrap
                    ${
                      isActiveLink(link.to)
                        ? "text-gray-900 bg-gray-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  <link.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="hidden lg:inline">{link.label}</span>
                  {isActiveLink(link.to) && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Search Button - Mobile */}
              <button
                type="button"
                onClick={openMobileSearch}
                aria-label="Search"
                className="md:hidden p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>

              {/* Cart Button */}
              <Link to="/cart" className="relative group">
                <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-all duration-300">
                  <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform duration-300" />
                </div>
                {cart?.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 shadow-lg animate-pulse">
                    {cart?.items?.length}
                  </span>
                )}
              </Link>

              {/* User Section - Desktop */}
              <div className="hidden md:block user-menu relative ">
                {user ? (
                  <div>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-50 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:scale-105 transition-transform">
                        {user.firstName?.charAt(0).toUpperCase()}
                        {user.lastName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="max-w-28 truncate text-sm font-medium text-gray-700">
                          {user.firstName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role === "admin" ? "Administrator" : "Customer"}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slideDown">
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <p className="truncate font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate text-sm text-gray-500 mt-1" title={user.email}>
                            {user.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            to={`/profile/${user._id}`}
                            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-300"
                          >
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              My Profile
                            </span>
                          </Link>
                          <Link
                            to={`/profile/${user._id}?tab=orders`}
                            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-300"
                          >
                            <ShoppingBag className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              My Orders
                            </span>
                          </Link>
                          {admin && (
                            <Link
                              to="/dashboard"
                              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-300"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                Admin Panel
                              </span>
                            </Link>
                          )}
                          <button
                            onClick={LogoutHandler}
                            className="w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-red-50 transition-all duration-300 group"
                          >
                            <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                            <span className="text-sm text-red-600 group-hover:text-red-700 cursor-pointer">
                              Logout
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={goToLogin}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer "
                  >
                    Sign In
                  </Button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - scrolls inside itself when taller than the screen (e.g. landscape phones) */}
        <div
          className={`
          md:hidden fixed inset-x-0 top-16 bg-white shadow-xl transition-all duration-300 z-40
          ${
            isMobileMenuOpen
              ? "max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-gray-100"
              : "max-h-0 overflow-hidden"
          }
        `}
        >
          <div className="px-4 py-4 space-y-3">
            {searchForm("block", "mobile-search")}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${
                    isActiveLink(link.to)
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}

            {user && (
              <>
                <div className="h-px bg-gray-100 my-2 " />
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-300"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">My Profile</span>
                </Link>
                <Link
                  to={`/profile/${user._id}?tab=orders`}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-300"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="font-medium">My Orders</span>
                </Link>
              </>
            )}

            <div className="pt-2">
              {user ? (
                <Button
                  onClick={LogoutHandler}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md"
                >
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={goToLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add this to your global CSS file */}
      <style>{`
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
  );
};

export default Navbar;
