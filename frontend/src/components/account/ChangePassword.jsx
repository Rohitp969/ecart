import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { API_URL, authConfig } from "@/lib/admin";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

const validate = (form) => {
  const errors = {};
  if (!form.currentPassword) errors.currentPassword = "Enter your current password";
  if (form.newPassword.length < 6) errors.newPassword = "Use at least 6 characters";
  else if (form.newPassword === form.currentPassword) errors.newPassword = "New password must be different";
  if (form.confirmPassword !== form.newPassword) errors.confirmPassword = "Passwords don't match";
  return errors;
};

const PasswordField = ({ label, id, value, onChange, error, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          className={`h-11 w-full rounded-lg border px-3 pr-11 text-sm text-gray-900 outline-none transition focus:ring-2 ${
            error ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

const ChangePassword = () => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/v1/user/update-password`,
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        authConfig(),
      );
      toast.success(res.data.message);
      setForm(EMPTY);
    } catch (error) {
      const message = error.response?.data?.message || "Could not update password";
      if (/current password/i.test(message)) setErrors({ currentPassword: message });
      else toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-gray-900">Change password</h2>
      <p className="text-sm text-gray-500">Use a strong password you don't use on other sites.</p>

      <div className="mt-5 max-w-xl">
        <div className="space-y-4">
          <PasswordField
            label="Current password"
            id="currentPassword"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
          />
          <PasswordField
            label="New password"
            id="newPassword"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
          />
          <PasswordField
            label="Confirm new password"
            id="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
          At least 6 characters. Mixing letters, numbers and symbols makes it stronger.
        </p>

        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <Link to="/forgot-password" className="text-sm font-semibold text-pink-600 hover:underline">
            Forgot your current password?
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChangePassword;
