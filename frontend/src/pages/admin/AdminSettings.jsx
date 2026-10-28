import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Phone, Truck } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { btnPrimary, card, input } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL, authConfig, loadErrorMessage } from "@/lib/admin";
import ErrorState from "@/components/admin/ErrorState";
import { setStoreSettings } from "@/lib/storeSettings";

const NUMBER_FIELDS = [
  { name: "shippingFee", label: "Shipping charge (₹)", hint: "Charged on orders at or below the free delivery limit", step: "1" },
  { name: "freeShippingAbove", label: "Free delivery above (₹)", hint: "Orders above this amount ship free", step: "1" },
  { name: "taxRate", label: "Tax (%)", hint: "Added to every order", step: "0.5" },
  { name: "returnWindowDays", label: "Return window (days)", hint: "Shown on the help pages and at checkout", step: "1" },
];

const TEXT_FIELDS = [
  { name: "supportEmail", label: "Support email", type: "email" },
  { name: "supportPhone", label: "Support phone", type: "tel" },
  { name: "supportHours", label: "Support hours", type: "text" },
  { name: "address", label: "Office address", type: "text", wide: true },
];

const Section = ({ icon, title, description, children }) => {
  const Icon = icon;
  return (
    <section className={`p-5 sm:p-6 ${card}`}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
};

// Admin → Store settings: delivery charges, tax, COD and the contact details shown in the store
const AdminSettings = () => {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => {
    setError("");
    setReloadKey((key) => key + 1);
  };
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_URL}/api/v1/settings`)
      .then((res) => !ignore && setForm(res.data.settings))
      .catch((err) => !ignore && setError(loadErrorMessage(err, "store settings")));
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const set = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/v1/settings`, form, authConfig());
      setForm(res.data.settings);
      setStoreSettings(res.data.settings);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the settings");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl">
        <AdminPageHeader title="Store Settings" description="Delivery charges, tax, payment options and the contact details customers see" />
        <ErrorState title="Couldn't load the store settings" message={error} onRetry={retry} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  const shippingFee = Number(form.shippingFee) || 0;
  const freeAbove = Number(form.freeShippingAbove) || 0;

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <AdminPageHeader title="Store Settings" description="Delivery charges, tax, payment options and the contact details customers see">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
        </button>
      </AdminPageHeader>

      <Section icon={Truck} title="Delivery, tax & payments" description="Used for every order total, in the cart, at checkout and on the server">
        <div className="grid gap-4 sm:grid-cols-2">
          {NUMBER_FIELDS.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">{field.label}</span>
              <input type="number" min="0" step={field.step} required value={form[field.name]} onChange={set(field.name)} className={`${input} h-11`} />
              <span className="mt-1 block text-xs text-gray-400">{field.hint}</span>
            </label>
          ))}
        </div>

        <label className="mt-5 flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <span>
            <span className="block font-semibold text-gray-900">Cash on Delivery</span>
            <span className="block text-sm text-gray-500">
              {form.codEnabled ? "Customers can choose to pay when the order arrives." : "Turned off: customers must pay online at checkout."}
            </span>
          </span>
          <input type="checkbox" checked={form.codEnabled} onChange={set("codEnabled")} className="peer sr-only" />
          <span
            aria-hidden
            className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-gray-300 transition peer-checked:bg-pink-600 peer-focus-visible:ring-2 peer-focus-visible:ring-pink-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
          />
        </label>

        <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Orders above ₹{freeAbove} ship free; smaller orders pay ₹{shippingFee} for delivery. {Number(form.taxRate) || 0}% tax is added to every
          order.
        </p>
      </Section>

      <Section icon={Phone} title="Contact details" description="Shown in the store footer, the Contact Us page and the policies">
        <div className="grid gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map((field) => (
            <label key={field.name} className={`block ${field.wide ? "sm:col-span-2" : ""}`}>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">{field.label}</span>
              <input type={field.type} required value={form[field.name]} onChange={set(field.name)} className={`${input} h-11`} />
            </label>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
        </button>
      </div>
    </form>
  );
};

export default AdminSettings;
