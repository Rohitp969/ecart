import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Mail, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ChangePassword from "./ChangePassword";
import { setUser } from "@/redux/userSlice";
import { setCart } from "@/redux/productSlice";
import { API_URL, authConfig } from "@/lib/admin";
import { isAdmin } from "@/lib/auth";

const cardClass = "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6";

// Newsletter on/off for the account's email
const EmailPreferences = () => {
  const { user } = useSelector((store) => store.user);
  const [subscribed, setSubscribed] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_URL}/api/v1/support/newsletter`, authConfig())
      .then((res) => !ignore && setSubscribed(res.data.subscribed))
      .catch(() => !ignore && setSubscribed(false));
    return () => {
      ignore = true;
    };
  }, []);

  const toggle = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/v1/support/newsletter`, { subscribed: !subscribed }, authConfig());
      setSubscribed(res.data.subscribed);
      toast.success(res.data.message);
    } catch (error) {
      if (error.response?.status !== 401) toast.error(error.response?.data?.message || "Could not update your preference");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={cardClass}>
      <h2 className="text-lg font-bold text-gray-900">Email notifications</h2>
      <p className="text-sm text-gray-500">Choose what we send to {user?.email}.</p>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <p id="newsletter-label" className="font-semibold text-gray-900">
              Deals & offers newsletter
            </p>
            <p className="text-sm text-gray-500">New arrivals, exclusive discounts and giveaways.</p>
          </div>
        </div>
        {subscribed === null ? (
          <Skeleton className="h-6 w-11 rounded-full" />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={subscribed}
            aria-labelledby="newsletter-label"
            onClick={toggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition disabled:cursor-wait disabled:opacity-60 ${
              subscribed ? "bg-pink-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                subscribed ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Emails about your orders, password resets and account security are always sent.
      </p>
    </section>
  );
};

// Permanently delete the account (password + typed confirmation)
const DeleteAccount = () => {
  const { user } = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const admin = isAdmin(user);

  const close = (next) => {
    if (deleting) return;
    setOpen(next);
    if (!next) {
      setPassword("");
      setConfirmText("");
      setError("");
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    setDeleting(true);
    setError("");
    try {
      const res = await axios.delete(`${API_URL}/api/v1/user/me`, { ...authConfig(), data: { password } });
      // leave the protected page first, then clear the session (same order as logout)
      navigate("/", { replace: true, flushSync: true });
      localStorage.removeItem("accessToken");
      dispatch(setUser(null));
      dispatch(setCart({ items: [], totalPrice: 0 }));
      toast.success(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete your account");
      setDeleting(false);
    }
  };

  return (
    <section className={`${cardClass} border-red-100`}>
      <h2 className="text-lg font-bold text-red-600">Delete account</h2>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        Permanently delete your account, saved addresses, cart and newsletter subscription. Your past orders are kept for
        our records. This can't be undone.
      </p>
      {admin ? (
        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Admin accounts can't be deleted here. Ask another admin to change your role to customer first.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> Delete my account
        </button>
      )}

      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          <form onSubmit={deleteAccount} className="grid gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> Delete your account?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Your profile, saved addresses and cart will be removed permanently. Orders that are still on the way must be
                delivered or cancelled first.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div>
              <label htmlFor="delete-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Your password
              </label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label htmlFor="delete-confirm" className="mb-1.5 block text-sm font-medium text-gray-700">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </label>
              <input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-gray-200 px-3 font-mono text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={deleting}>
                Cancel
              </AlertDialogCancel>
              <button
                type="submit"
                disabled={deleting || !password || confirmText !== "DELETE"}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete account
              </button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

const Settings = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
    <p className="text-sm text-gray-500">Manage notifications, your password and your account.</p>
    <div className="mt-5 space-y-6">
      <EmailPreferences />
      <ChangePassword />
      <DeleteAccount />
    </div>
  </div>
);

export default Settings;
