import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { CircleHelp, LogOut, MapPin, Package, PackageSearch, Settings as SettingsIcon, User } from "lucide-react";
import MyOrders from "@/components/account/MyOrders";
import ProfileForm from "@/components/account/ProfileForm";
import SavedAddresses from "@/components/account/SavedAddresses";
import Settings from "@/components/account/Settings";
import useLogout from "@/hooks/useLogout";
import { initials } from "@/lib/admin";

// ?tab= picks the section, so footer / navbar / order-success links can open one directly
const SECTIONS = [
  { key: "orders", label: "My Orders", icon: Package, component: MyOrders },
  { key: "profile", label: "Profile Information", icon: User, component: ProfileForm },
  { key: "addresses", label: "Saved Addresses", icon: MapPin, component: SavedAddresses },
  { key: "settings", label: "Settings", icon: SettingsIcon, component: Settings },
];
// older links
const TAB_ALIASES = { security: "settings" };

const QUICK_LINKS = [
  { to: "/track-order", label: "Track an order", icon: PackageSearch },
  { to: "/faqs", label: "Help Center", icon: CircleHelp },
];

const Profile = () => {
  const { user } = useSelector((store) => store.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const logout = useLogout();

  const tab = searchParams.get("tab");
  const active = SECTIONS.find((s) => s.key === (TAB_ALIASES[tab] || tab)) || SECTIONS[1];
  const ActiveSection = active.component;
  const openSection = (key) => setSearchParams(key === "profile" ? {} : { tab: key }, { replace: true });

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  const navClass = (isActive) =>
    `flex shrink-0 cursor-pointer items-center gap-3 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition lg:w-full lg:rounded-xl lg:border-0 lg:px-3 lg:py-2.5 ${
      isActive
        ? "border-pink-200 bg-pink-50 text-pink-700"
        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 lg:bg-transparent"
    }`;

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-12 md:pt-24">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[270px_minmax(0,1fr)]">
        {/* min-w-0: below lg the tab row must scroll inside itself, not widen the grid column */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-lg font-bold text-white">
                {initials(user)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Hello,</p>
              <p className="truncate font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              {memberSince && <p className="text-xs text-gray-400">Member since {memberSince}</p>}
            </div>
          </div>

          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-gray-100 lg:bg-white lg:p-2 lg:shadow-sm">
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => openSection(section.key)}
                aria-current={active.key === section.key ? "page" : undefined}
                className={navClass(active.key === section.key)}
              >
                <section.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                {section.label}
              </button>
            ))}
            {QUICK_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={`${navClass(false)} lg:hidden`}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm lg:block">
            {QUICK_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={navClass(false)}>
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <ActiveSection />
        </section>
      </div>
    </main>
  );
};

export default Profile;
