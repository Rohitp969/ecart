import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronDown, ExternalLink, LogOut, Menu, User } from "lucide-react";
import UserAvatar from "./UserAvatar";
import useLogout from "@/hooks/useLogout";

// Admin panel header (replaces the store navbar inside /dashboard)
const AdminTopbar = ({ onMenuClick }) => {
  const { user } = useSelector((store) => store.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !menuRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
          <img src="/Ekart-logo.png" alt="Ekart" className="w-24 sm:w-28" />
          <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Admin</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/"
          className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:flex"
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
                <Link to={`/profile/${user?._id}`} role="menuitem" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4 text-gray-500" /> My profile
                </Link>
                <Link to="/" role="menuitem" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:hidden">
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
