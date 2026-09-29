import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BadgeCheck, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/admin/StatCard";
import UserAvatar from "@/components/admin/UserAvatar";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL, authConfig, formatDate, fullName } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";

const PAGE_SIZE = 15;
const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  name: (a, b) => fullName(a).localeCompare(fullName(b)),
  spent: (a, b) => b.spent - a.spent,
  orders: (a, b) => b.orders - a.orders,
};

const RoleBadge = ({ role }) =>
  role === "admin" ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
      <ShieldCheck className="h-3.5 w-3.5" /> Admin
    </span>
  ) : (
    <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Customer</span>
  );

// "phone · city", or "" when neither is known
const contactLine = (user) => [user.phoneNo, user.city].filter(Boolean).join(" · ");

const AdminUsers = () => {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_URL}/api/v1/user/all-user`, authConfig())
      .then((res) => !ignore && setUsers(res.data.users))
      .catch((err) => !ignore && setError(err.response?.data?.message || "Could not load users"));
    return () => {
      ignore = true;
    };
  }, []);

  const summary = useMemo(() => {
    const list = users || [];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return {
      total: list.length,
      admins: list.filter((u) => u.role === "admin").length,
      verified: list.filter((u) => u.isVerified).length,
      newThisMonth: list.filter((u) => new Date(u.createdAt) >= monthStart).length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users || [])
      .filter(
        (u) =>
          (!role || u.role === role) &&
          (!q || `${fullName(u)} ${u.email} ${u.phoneNo || ""} ${u.city || ""}`.toLowerCase().includes(q)),
      )
      .sort(SORTS[sort]);
  }, [users, search, role, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  // phones: selects fill the row two-up under the search box; from sm they keep their natural width
  const selectClass =
    "min-w-0 grow basis-32 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-pink-500 sm:grow-0 sm:basis-auto";

  return (
    <div>
      <AdminPageHeader title="Users" description="Customers and team members with access to your store" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={summary.total} icon={Users} tone="blue" hint="All registered accounts" />
        <StatCard label="Admins" value={summary.admins} icon={ShieldCheck} tone="purple" hint="Can open this panel" />
        <StatCard label="Verified" value={summary.verified} icon={BadgeCheck} tone="green" hint="Email verified" />
        <StatCard label="New this month" value={summary.newThisMonth} icon={UserPlus} tone="amber" hint="Joined since the 1st" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => withReset(setSearch)(e.target.value)}
              placeholder="Search by name, email, phone or city"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500"
            />
          </div>
          <select value={role} onChange={(e) => withReset(setRole)(e.target.value)} className={selectClass} aria-label="Role">
            <option value="">All roles</option>
            <option value="user">Customers</option>
            <option value="admin">Admins</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="spent">Most spent</option>
            <option value="orders">Most orders</option>
          </select>
        </div>

        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : (
          <>
            {/* phones: stacked cards */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {!users
                ? Array.from({ length: 4 }, (_, i) => (
                    <li key={i} className="p-4"><Skeleton className="h-20 w-full" /></li>
                  ))
                : rows.map((user) => (
                    <li key={user._id} className="flex items-start gap-3 p-4">
                      <UserAvatar user={user} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link to={`/dashboard/users/${user._id}`} className="flex min-w-0 items-center gap-1 font-semibold text-gray-900 hover:text-pink-600">
                            <span className="truncate">{fullName(user)}</span>
                            {user.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" aria-label="Verified" />}
                          </Link>
                          <RoleBadge role={user.role} />
                        </div>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                        {contactLine(user) && <p className="truncate text-xs text-gray-400">{contactLine(user)}</p>}
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold tabular-nums text-gray-900">{user.orders}</span> order{user.orders === 1 ? "" : "s"} ·{" "}
                            <span className="font-semibold tabular-nums text-gray-900">{formatPrice(user.spent)}</span> spent
                            <br />
                            Joined {formatDate(user.createdAt)}
                          </p>
                          <Link
                            to={`/dashboard/users/${user._id}`}
                            className="inline-flex shrink-0 items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Manage
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
            </ul>

            {/* md+: table; below xl the Contact and Joined columns fold into the user cell so it fits beside the sidebar */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-3 py-3 font-semibold">Role</th>
                    <th className="hidden px-3 py-3 font-semibold xl:table-cell">Contact</th>
                    <th className="px-3 py-3 text-right font-semibold">Orders</th>
                    <th className="px-3 py-3 text-right font-semibold">Spent</th>
                    <th className="hidden px-3 py-3 font-semibold xl:table-cell">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!users
                    ? Array.from({ length: 6 }, (_, i) => (
                        <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>
                      ))
                    : rows.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} />
                              <div className="min-w-0">
                                <Link to={`/dashboard/users/${user._id}`} className="flex items-center gap-1 font-semibold text-gray-900 hover:text-pink-600">
                                  {fullName(user)}
                                  {user.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" aria-label="Verified" />}
                                </Link>
                                <p className="max-w-48 truncate text-xs text-gray-500 xl:max-w-64" title={user.email}>{user.email}</p>
                                <p className="text-xs text-gray-400 xl:hidden">
                                  {[contactLine(user), `Joined ${formatDate(user.createdAt)}`].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><RoleBadge role={user.role} /></td>
                          <td className="hidden px-3 py-3 text-gray-600 xl:table-cell">
                            <p>{user.phoneNo || "—"}</p>
                            <p className="text-xs text-gray-400">{user.city || ""}</p>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-900">{user.orders}</td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900">{formatPrice(user.spent)}</td>
                          <td className="hidden px-3 py-3 text-gray-500 xl:table-cell">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/dashboard/users/${user._id}`}
                              className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {users && rows.length === 0 && <p className="px-4 py-12 text-center text-sm text-gray-500">No users match these filters.</p>}
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            {filtered.length
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`
              : "0 users"}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
