import React, { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { INDIAN_STATES, cleanAddress, isIndia, validateAddress } from "../lib/address";

function FormField({ label, id, error, className = "", ...inputProps }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
          error ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
        }`}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// Add / edit a delivery address. onSubmit(address, { isDefault }) resolves truthy when saved.
const AddressEditor = ({ initial, title, subtitle, submitLabel = "Save address", onSubmit, onCancel, showDefaultOption, defaultChecked = false }) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [isDefault, setIsDefault] = useState(defaultChecked);
  const [saving, setSaving] = useState(false);
  const india = isIndia(form.country);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateAddress(form);
    setErrors(found);
    if (Object.keys(found).length) {
      // bring the first bad field into view
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(cleanAddress(form), { isDefault });
    } finally {
      setSaving(false);
    }
  };

  const field = (name) => ({ value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {title && (
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" id="fullName" autoComplete="name" placeholder="e.g. Rahul Sharma" {...field("fullName")} />
        <FormField
          label="Mobile number"
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit mobile number"
          {...field("phone")}
        />
        <FormField
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="sm:col-span-2"
          {...field("email")}
        />
        <FormField
          label="Address"
          id="address"
          autoComplete="street-address"
          placeholder="House no., building, street, area"
          className="sm:col-span-2"
          {...field("address")}
        />
        <FormField label="City" id="city" autoComplete="address-level2" placeholder="e.g. Mumbai" {...field("city")} />
        <FormField
          label="State"
          id="state"
          autoComplete="address-level1"
          list={india ? "indian-states" : undefined}
          placeholder="e.g. Maharashtra"
          {...field("state")}
        />
        <FormField
          label={india ? "PIN code" : "Postal code"}
          id="zip"
          inputMode={india ? "numeric" : "text"}
          maxLength={india ? 6 : 10}
          autoComplete="postal-code"
          placeholder={india ? "6-digit PIN code" : "Postal code"}
          {...field("zip")}
        />
        <FormField label="Country" id="country" autoComplete="country-name" {...field("country")} />
      </div>
      <datalist id="indian-states">
        {INDIAN_STATES.map((state) => (
          <option key={state} value={state} />
        ))}
      </datalist>

      {showDefaultOption && (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-pink-600"
          />
          Make this my default address
        </label>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-11 cursor-pointer rounded-lg border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default AddressEditor;
