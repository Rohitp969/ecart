import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Search, TicketPercent, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatCard from "@/components/admin/StatCard";
import { btnPrimary, btnSecondary, card, input } from "@/components/admin/ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL, authConfig, formatDate, loadErrorMessage } from "@/lib/admin";
import ErrorState from "@/components/admin/ErrorState";
import { formatMoney } from "@/lib/orders";

const COUPON_API = `${API_URL}/api/v1/coupons`;

// what the customer gets, in one line
const describe = (c) =>
  c.type === "percent"
    ? `${c.value}% off${c.maxDiscount ? ` (up to ${formatMoney(c.maxDiscount)})` : ""}`
    : `${formatMoney(c.value)} off`;

const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();
const isUsedUp = (c) => c.usageLimit && c.usedCount >= c.usageLimit;

const StatusBadge = ({ coupon }) => {
  const [label, className] = !coupon.active
    ? ["Paused", "bg-gray-100 text-gray-600"]
    : isExpired(coupon)
      ? ["Expired", "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"]
      : isUsedUp(coupon)
        ? ["Used up", "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"]
        : ["Active", "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{label}</span>;
};

// on/off toggle in the list
const CouponSwitch = ({ coupon, busy, onToggle }) => (
  <button
    role="switch"
    aria-checked={coupon.active}
    aria-label={coupon.active ? `Pause ${coupon.code}` : `Activate ${coupon.code}`}
    onClick={() => onToggle(coupon)}
    disabled={busy}
    className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:opacity-50 ${coupon.active ? "bg-pink-600" : "bg-gray-300"}`}
  >
    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${coupon.active ? "translate-x-5" : ""}`} />
  </button>
);

const toForm = (c) => ({
  code: c?.code || "",
  description: c?.description || "",
  type: c?.type || "percent",
  value: c?.value ?? "",
  maxDiscount: c?.maxDiscount ?? "",
  minOrder: c?.minOrder || "",
  usageLimit: c?.usageLimit ?? "",
  expiresAt: c?.expiresAt ? c.expiresAt.slice(0, 10) : "",
  active: c?.active ?? true,
});

const Field = ({ label, hint, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
  </label>
);

const CouponDialog = ({ coupon, onClose, onSaved }) => {
  const editing = Boolean(coupon?._id);
  const [form, setForm] = useState(() => toForm(coupon));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [name]: name === "code" ? value.toUpperCase().replace(/\s/g, "") : value }));
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!/^[A-Z0-9_-]{3,20}$/.test(form.code)) return setError("Code must be 3–20 letters or numbers (no spaces)");
    const value = Number(form.value);
    if (!(value > 0)) return setError("Enter a discount above 0");
    if (form.type === "percent" && value > 90) return setError("Percent discount can be at most 90%");

    setSaving(true);
    try {
      const res = editing
        ? await axios.put(`${COUPON_API}/${coupon._id}`, form, authConfig())
        : await axios.post(COUPON_API, form, authConfig());
      toast.success(res.data.message);
      onSaved(res.data.coupon);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the coupon");
    } finally {
      setSaving(false);
    }
  };

  const percent = form.type === "percent";

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[95vw] overflow-y-auto p-4 sm:max-w-xl sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle>{editing ? `Edit ${coupon.code}` : "Create coupon"}</DialogTitle>
          <DialogDescription>Customers type the code at checkout to get the discount.</DialogDescription>
        </DialogHeader>

        <form onSubmit={save} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" hint="Letters and numbers, e.g. SAVE10">
              <input value={form.code} onChange={set("code")} maxLength={20} placeholder="SAVE10" className={`${input} font-mono uppercase`} />
            </Field>
            <Field label="Discount type">
              <select value={form.type} onChange={set("type")} className={`${input} cursor-pointer`}>
                <option value="percent">Percent off (%)</option>
                <option value="flat">Flat amount off (₹)</option>
              </select>
            </Field>
            <Field label={percent ? "Discount (%)" : "Discount (₹)"}>
              <input type="number" min="1" max={percent ? 90 : undefined} value={form.value} onChange={set("value")} className={input} />
            </Field>
            {percent ? (
              <Field label="Maximum discount (₹)" hint="Leave empty for no limit">
                <input type="number" min="0" value={form.maxDiscount} onChange={set("maxDiscount")} placeholder="No limit" className={input} />
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}
            <Field label="Minimum order (₹)" hint="Cart subtotal needed to use the code">
              <input type="number" min="0" value={form.minOrder} onChange={set("minOrder")} placeholder="0" className={input} />
            </Field>
            <Field label="Total uses allowed" hint="Leave empty for unlimited">
              <input type="number" min="0" value={form.usageLimit} onChange={set("usageLimit")} placeholder="Unlimited" className={input} />
            </Field>
            <Field label="Valid until" hint="Leave empty to never expire">
              <input type="date" value={form.expiresAt} onChange={set("expiresAt")} className={`${input} cursor-pointer`} />
            </Field>
            <Field label="Note (shown to customers)">
              <input value={form.description} onChange={set("description")} maxLength={120} placeholder="e.g. Diwali sale" className={input} />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.active} onChange={set("active")} className="h-4 w-4 accent-pink-600" />
            Customers can use this code
          </label>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save coupon" : "Create coupon"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Admin → Coupons: discount codes for checkout
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => {
    setError("");
    setReloadKey((key) => key + 1);
  };
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // {} for a new coupon
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let ignore = false;
    axios
      .get(COUPON_API, authConfig())
      .then((res) => !ignore && setCoupons(res.data.coupons || []))
      .catch((err) => !ignore && setError(loadErrorMessage(err, "coupons")));
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const summary = useMemo(() => {
    const list = coupons || [];
    return {
      total: list.length,
      active: list.filter((c) => c.active && !isExpired(c) && !isUsedUp(c)).length,
      uses: list.reduce((sum, c) => sum + (c.usedCount || 0), 0),
    };
  }, [coupons]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (coupons || []).filter((c) => !q || `${c.code} ${c.description || ""}`.toLowerCase().includes(q));
  }, [coupons, search]);

  const replace = (saved) =>
    setCoupons((prev) => (prev.some((c) => c._id === saved._id) ? prev.map((c) => (c._id === saved._id ? saved : c)) : [saved, ...prev]));

  const toggle = async (coupon) => {
    setBusyId(coupon._id);
    try {
      const res = await axios.put(`${COUPON_API}/${coupon._id}`, { active: !coupon.active }, authConfig());
      replace(res.data.coupon);
      toast.success(coupon.active ? `${coupon.code} paused` : `${coupon.code} is active`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the coupon");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setBusyId(toDelete._id);
    try {
      const res = await axios.delete(`${COUPON_API}/${toDelete._id}`, authConfig());
      setCoupons((prev) => prev.filter((c) => c._id !== toDelete._id));
      toast.success(res.data.message);
      setToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the coupon");
    } finally {
      setBusyId(null);
    }
  };

  const actions = (coupon) => (
    <div className="flex justify-end gap-1">
      <button onClick={() => setEditing(coupon)} title="Edit" aria-label={`Edit ${coupon.code}`}
        className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={() => setToDelete(coupon)} title="Delete" aria-label={`Delete ${coupon.code}`}
        className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div>
      <AdminPageHeader title="Coupons" description="Discount codes customers can apply at checkout">
        <button onClick={() => setEditing({})} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Create coupon
        </button>
      </AdminPageHeader>

      {coupons && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Coupons" value={summary.total} icon={TicketPercent} tone="pink" hint="All codes you've created" />
          <StatCard label="Usable now" value={summary.active} icon={TicketPercent} tone="green" hint="Active, not expired or used up" />
          <StatCard label="Times used" value={summary.uses} icon={TicketPercent} tone="purple" hint="On confirmed orders" />
        </div>
      )}

      <div className={card}>
        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or note"
              aria-label="Search coupons"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {error ? (
          <ErrorState inline title="Couldn't load coupons" message={error} onRetry={retry} />
        ) : !coupons ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <TicketPercent className="h-12 w-12 text-gray-300" />
            <p className="mt-3 font-semibold text-gray-900">{coupons.length ? "No coupons match your search" : "No coupons yet"}</p>
            {!coupons.length && (
              <>
                <p className="mt-1 text-sm text-gray-500">Create a code like SAVE10 to give customers a discount at checkout.</p>
                <button onClick={() => setEditing({})} className={`${btnPrimary} mt-5`}>
                  <Plus className="h-4 w-4" /> Create coupon
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* phones: stacked cards */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {rows.map((coupon) => (
                <li key={coupon._id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-gray-900">{coupon.code}</p>
                      <p className="text-sm text-gray-700">{describe(coupon)}</p>
                      {coupon.description && <p className="truncate text-xs text-gray-500">{coupon.description}</p>}
                    </div>
                    <CouponSwitch coupon={coupon} busy={busyId === coupon._id} onToggle={toggle} />
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      Min {formatMoney(coupon.minOrder || 0)} · used {coupon.usedCount}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""} · {coupon.expiresAt ? `till ${formatDate(coupon.expiresAt)}` : "no expiry"}
                      <br />
                      <StatusBadge coupon={coupon} />
                    </p>
                    {actions(coupon)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-3 py-3 font-semibold">Discount</th>
                    <th className="px-3 py-3 text-right font-semibold">Min order</th>
                    <th className="px-3 py-3 text-right font-semibold">Used</th>
                    <th className="px-3 py-3 font-semibold">Valid until</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">On</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-gray-900">{coupon.code}</p>
                        {coupon.description && <p className="max-w-48 truncate text-xs text-gray-500">{coupon.description}</p>}
                      </td>
                      <td className="px-3 py-3 text-gray-700">{describe(coupon)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-gray-700">{coupon.minOrder ? formatMoney(coupon.minOrder) : "—"}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-gray-700">
                        {coupon.usedCount}
                        {coupon.usageLimit ? <span className="text-gray-400"> / {coupon.usageLimit}</span> : ""}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{coupon.expiresAt ? formatDate(coupon.expiresAt) : "No expiry"}</td>
                      <td className="px-3 py-3"><StatusBadge coupon={coupon} /></td>
                      <td className="px-3 py-3"><CouponSwitch coupon={coupon} busy={busyId === coupon._id} onToggle={toggle} /></td>
                      <td className="px-4 py-3">{actions(coupon)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editing && (
        <CouponDialog
          coupon={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            replace(saved);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.code}?`}
        description="Customers won't be able to use this code any more. Orders that already used it keep their discount."
        confirmLabel="Delete"
        busy={busyId === toDelete?._id}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default AdminCoupons;
