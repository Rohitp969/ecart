import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { HELP_PAGES } from "../lib/help";

// Shell for the help-center pages linked from the footer: title banner + help menu + page body
const HelpLayout = ({ title, description, icon: Icon, children }) => (
  <main className="min-h-screen bg-gray-50 pt-20 pb-12 md:pt-24">
    <div className="mx-auto max-w-7xl px-4">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-gray-500">
        <Link to="/" className="hover:text-pink-600">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">{title}</span>
      </nav>

      <header className="relative overflow-hidden rounded-2xl bg-linear-to-r from-pink-600 to-rose-500 px-6 py-8 text-white sm:px-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          {Icon && (
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
              <Icon className="h-7 w-7" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-pink-50 sm:text-base">{description}</p>}
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* min-w-0: below lg the chip row must scroll inside itself, not widen the grid column */}
        <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="mb-2 hidden px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 lg:block">Help Center</p>
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
            {HELP_PAGES.map((page) => (
              <NavLink
                key={page.to}
                to={page.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition lg:rounded-xl lg:border-0 lg:px-3 lg:py-2.5 ${
                    isActive
                      ? "border-pink-200 bg-pink-50 text-pink-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:bg-transparent"
                  }`
                }
              >
                <page.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                {page.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  </main>
);

export default HelpLayout;

// White content card used inside help pages
export const HelpCard = ({ title, children, className = "" }) => (
  <section className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
    {title && <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>}
    {children}
  </section>
);
