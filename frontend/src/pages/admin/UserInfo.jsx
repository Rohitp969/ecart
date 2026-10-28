import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Ban, BadgeCheck, Camera, Eye, Loader2, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import OrderDetailsDialog, { FulfilmentSelect } from "@/components/admin/OrderDetailsDialog";
import { PaymentBadge } from "@/components/admin/StatusBadge";
import UserAvatar from "@/components/admin/UserAvatar";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ErrorState from "@/components/admin/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { setUser } from "@/redux/userSlice";
import { API_URL, authConfig, formatDate, fullName, loadErrorMessage, saveOrderStatus, shortId } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { useAdminAlerts } from "@/lib/adminAlerts";

const EDITABLE = ["firstName", "lastName", "phoneNo", "address", "city", "zipCode"];

const Stat = ({ label, value, className = "" }) => (
  <div className={`min-w-0 rounded-xl bg-gray-50 px-4 py-3 ${className}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-lg font-bold wrap-break-word text-gray-900 tabular-nums">{value}</p>
  </div>
);

const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100";

const UserInfo = () => {
  const { id: userId } = useParams();
  const dispatch = useDispatch();
  const { user: me } = useSelector((store) => store.user);
  const { refreshAlerts } = useAdminAlerts();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null); // "block" | "delete"
  const [accountBusy, setAccountBusy] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => {
    setError("");
    setReloadKey((key) => key + 1);
  };
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const isSelf = me?._id === userId;

  useEffect(() => {
    let ignore = false;
    Promise.all([
      axios.get(`${API_URL}/api/v1/user/get-user/${userId}`, authConfig()),
      axios.get(`${API_URL}/api/v1/orders/user-order/${userId}`, authConfig()),
    ])
      .then(([userRes, orderRes]) => {
        if (ignore) return;
        setProfile(userRes.data.user);
        setForm({ ...Object.fromEntries(EDITABLE.map((k) => [k, userRes.data.user[k] || ""])), role: userRes.data.user.role });
        setOrders(orderRes.data.orders);
      })
      .catch((err) => !ignore && setError(loadErrorMessage(err, "this user")));
    return () => {
      ignore = true;
    };
  }, [userId, reloadKey]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const stats = useMemo(() => {
    const list = orders || [];
    return {
      count: list.length,
      spent: list.filter((o) => o.status === "Paid").reduce((sum, o) => sum + o.amount, 0),
      last: list.reduce((latest, o) => (!latest || new Date(o.createdAt) > new Date(latest) ? o.createdAt : latest), null),
    };
  }, [orders]);

  const set = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    // send only real values, never the string "undefined"
    for (const key of EDITABLE) formData.append(key, form[key]?.trim?.() ?? "");
    if (!isSelf) formData.append("role", form.role);
    if (file) formData.append("file", file);
    try {
      setSaving(true);
      const res = await axios.put(`${API_URL}/api/v1/user/update/${userId}`, formData, authConfig());
      if (res.data.success) {
        setProfile(res.data.user);
        setFile(null);
        setPreview("");
        // only replace the logged-in session when admins edit their own account
        if (isSelf) dispatch(setUser(res.data.user));
        toast.success("User updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update user");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (order, orderStatus) => {
    setUpdatingId(order._id);
    const updated = await saveOrderStatus(order._id, orderStatus);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      refreshAlerts();
    }
    setUpdatingId(null);
  };

  // unblock straight away; blocking and deleting ask first
  const setBlocked = async (blocked) => {
    setAccountBusy(true);
    try {
      const res = await axios.put(`${API_URL}/api/v1/user/${userId}/block`, { blocked }, authConfig());
      setProfile((prev) => ({ ...prev, isBlocked: res.data.user.isBlocked }));
      toast.success(res.data.message);
      setConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update this account");
    } finally {
      setAccountBusy(false);
    }
  };

  const deleteAccount = async () => {
    setAccountBusy(true);
    try {
      const res = await axios.delete(`${API_URL}/api/v1/user/${userId}`, authConfig());
      toast.success(res.data.message);
      navigate("/admin/customers", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete this account");
      setAccountBusy(false);
    }
  };

  const back = (
    <Link to="/admin/customers" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900">
      <ArrowLeft className="h-4 w-4" /> Users
    </Link>
  );

  if (error) {
    return (
      <div>
        {back}
        <ErrorState title="Couldn't load this user" message={error} onRetry={retry} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        {back}
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {back}
      <AdminPageHeader title={fullName(profile)} description={`Customer since ${formatDate(profile.createdAt)}`} />

      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <UserAvatar user={{ ...profile, profilePic: preview || profile.profilePic }} size="h-16 w-16 text-xl" />
        {/* min-w-40: wrap the stats to their own row rather than squeezing the email into a sliver */}
        <div className="min-w-40 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="break-all">{profile.email}</span>
            {profile.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"><BadgeCheck className="h-4 w-4" /> Verified</span>
            )}
          </p>
          <div className="mt-2">
            {profile.role === "admin" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Customer</span>
            )}
            {profile.isBlocked && (
              <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                <Ban className="h-3.5 w-3.5" /> Blocked
              </span>
            )}
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-3">
          <Stat label="Orders" value={stats.count} />
          <Stat label="Total spent" value={formatPrice(stats.spent)} />
          <Stat label="Last order" value={stats.last ? formatDate(stats.last) : "—"} className="col-span-2 sm:col-span-1" />
        </div>
      </div>

      {/* block / delete: customers only, never your own account */}
      {!isSelf && profile.role !== "admin" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-bold text-gray-900">Account access</h2>
            <p className="text-sm text-gray-500">
              {profile.isBlocked
                ? "This customer is blocked: they can't sign in or place orders."
                : "Block this customer to stop them signing in, or delete the account. Their orders stay in your records."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.isBlocked ? (
              <button
                onClick={() => setBlocked(false)}
                disabled={accountBusy}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {accountBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Unblock
              </button>
            ) : (
              <button
                onClick={() => setConfirm("block")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                <Ban className="h-4 w-4" /> Block
              </button>
            )}
            <button
              onClick={() => setConfirm("delete")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm === "delete" ? `Delete ${fullName(profile)}'s account?` : `Block ${fullName(profile)}?`}
        description={
          confirm === "delete"
            ? "The account, cart and saved addresses are removed for good. Their orders stay in your records as \"Deleted user\". This can't be undone."
            : "They'll be signed out and won't be able to sign in or place orders until you unblock them."
        }
        confirmLabel={confirm === "delete" ? "Delete account" : "Block"}
        busy={accountBusy}
        onConfirm={() => (confirm === "delete" ? deleteAccount() : setBlocked(true))}
        onCancel={() => setConfirm(null)}
      />

      {/* side by side from xl only; at lg (next to the admin sidebar) the form column would be ~220px */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <form onSubmit={save} className="space-y-4 self-start rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Profile details</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-pink-600 hover:underline">
            <Camera className="h-4 w-4" /> Change picture
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (!picked) return;
                setFile(picked);
                setPreview(URL.createObjectURL(picked));
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">First name</span>
              <input value={form.firstName} onChange={set("firstName")} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">Last name</span>
              <input value={form.lastName} onChange={set("lastName")} className={inputClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">Phone</span>
            <input value={form.phoneNo} onChange={set("phoneNo")} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">Address</span>
            <input value={form.address} onChange={set("address")} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">City</span>
              <input value={form.city} onChange={set("city")} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-gray-700">ZIP code</span>
              <input value={form.zipCode} onChange={set("zipCode")} className={inputClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">Role</span>
            <select value={form.role} onChange={set("role")} disabled={isSelf} className={`${inputClass} cursor-pointer bg-white disabled:cursor-not-allowed disabled:bg-gray-50`}>
              <option value="user">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <span className="mt-1 block text-xs text-gray-400">
              {isSelf ? "You can't change your own role." : "Admins can open this dashboard and manage the store."}
            </span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </button>
        </form>

        {/* @container: orders show as a stacked list until the section is wide enough for the table */}
        <section className="@container min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm xl:col-span-2">
          <h2 className="border-b border-gray-100 px-5 py-4 font-bold text-gray-900">Orders ({stats.count})</h2>
          {orders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-500">This user hasn't placed any orders yet.</p>
          ) : (
            <>
              <ul className="divide-y divide-gray-100 @2xl:hidden">
                {orders.map((order) => {
                  const units = order.products.reduce((s, p) => s + p.quantity, 0);
                  return (
                    <li key={order._id} className="flex flex-wrap items-center gap-3 px-5 py-4 @lg:flex-nowrap">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => setSelectedId(order._id)}
                          className="cursor-pointer font-mono text-sm font-bold text-gray-900 hover:text-pink-600"
                        >
                          {shortId(order._id)}
                        </button>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)} · {units} item{units === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-semibold tabular-nums text-gray-900">{formatPrice(order.amount)}</span>
                        <PaymentBadge status={order.status} method={order.paymentMethod} />
                      </div>
                      <div className="flex w-full items-center gap-2 @lg:w-auto">
                        <FulfilmentSelect
                          order={order}
                          onChange={changeStatus}
                          disabled={updatingId === order._id}
                          className="min-w-0 flex-1 py-2 text-sm @lg:flex-none"
                        />
                        <button
                          onClick={() => setSelectedId(order._id)}
                          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" /> View
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden overflow-x-auto @2xl:block">
                <table className="w-full min-w-160 text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Order</th>
                      <th className="px-3 py-3 text-right font-semibold">Total</th>
                      <th className="px-3 py-3 font-semibold">Payment</th>
                      <th className="px-3 py-3 font-semibold">Fulfilment</th>
                      <th className="px-5 py-3 text-right font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => {
                      const units = order.products.reduce((s, p) => s + p.quantity, 0);
                      return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-bold text-gray-900">{shortId(order._id)}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.createdAt)} · {units} item{units === 1 ? "" : "s"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900">{formatPrice(order.amount)}</td>
                        <td className="px-3 py-3"><PaymentBadge status={order.status} method={order.paymentMethod} /></td>
                        <td className="px-3 py-3">
                          <FulfilmentSelect order={order} onChange={changeStatus} disabled={updatingId === order._id} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setSelectedId(order._id)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <OrderDetailsDialog
        order={orders?.find((o) => o._id === selectedId) && { ...orders.find((o) => o._id === selectedId), user: profile }}
        onClose={() => setSelectedId(null)}
        onStatusChange={changeStatus}
      />
    </div>
  );
};

export default UserInfo;
