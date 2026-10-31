import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bell, ChevronDown, ExternalLink, LogOut, Menu, Search, User } from "lucide-react";
import UserAvatar from "./UserAvatar";
import useLogout from "@/hooks/useLogout";
import { alertItems, useAdminAlerts } from "@/lib/adminAlerts";

// close a dropdown on outside click / Escape
const useDismiss = (open, setOpen) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);
  return ref;
};

// Bell: orders to ship, new messages and stock problems, each linking to the right list
const Notifications = () => {
  const { alerts } = useAdminAlerts();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const items = alertItems(alerts).filter((item) => item.count > 0);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={total ? `Notifications, ${total} waiting` : "Notifications"}
        title="Notifications"
        className="relative cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Needs attention</p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">{alerts ? "You're all caught up." : "Couldn't load notifications."}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.key}>
                  <Link to={item.to} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-gray-50">
                    <span className="block text-sm font-semibold text-gray-900">
                      {item.count} {item.label(item.count)}
                    </span>
                    <span className="block text-xs text-gray-500">{item.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// Admin panel header (replaces the store navbar inside /admin)
const AdminTopbar = ({ onMenuClick, onSearchClick }) => {
  const { user } = useSelector((store) => store.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const menuRef = useDismiss(open, setOpen);

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open admin menu"
          className="-ml-2 shrink-0 cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/admin" className="flex shrink-0 items-center gap-2">
          <img src="/Ekart-logo.png" alt="Ekart" className="w-24 sm:w-28" />
          <span className="rounded-md bg-gray-900 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">Admin</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          onClick={onSearchClick}
          className="hidden cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 md:flex"
        >
          <Search className="h-4 w-4" /> Search pages
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 font-sans text-[11px]">Ctrl K</kbd>
        </button>
        <button
          onClick={onSearchClick}
          aria-label="Search pages"
          title="Search pages (Ctrl K)"
          className="hidden cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100 sm:block md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
        <Notifications />
        <Link
          to="/"
          className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 lg:flex"
        >
          <ExternalLink className="h-4 w-4" /> View store
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex cursor-pointer items-center gap-2 rounded-xl p-1.5 hover:bg-gray-50"
          >
            <UserAvatar user={user} size="h-8 w-8 text-xs" />
            <span className="hidden max-w-32 text-left md:block">
              <span className="block truncate text-sm font-semibold leading-tight text-gray-900">{user?.firstName}</span>
              <span className="block text-xs leading-tight text-gray-500">Administrator</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
              <div className="border-b border-gray-100 p-3">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <Link to="/admin/account" role="menuitem" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4 text-gray-500" /> My profile
                </Link>
                <Link to="/" role="menuitem" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 lg:hidden">
                  <ExternalLink className="h-4 w-4 text-gray-500" /> View store
                </Link>
                <button role="menuitem" onClick={() => logout()}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
