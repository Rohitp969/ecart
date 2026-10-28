import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { BadgeCheck, Camera, Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import UserAvatar from "@/components/admin/UserAvatar";
import { btnPrimary, btnSecondary, card, input } from "@/components/admin/ui";
import useLogout from "@/hooks/useLogout";
import { setUser } from "@/redux/userSlice";
import { API_URL, authConfig, formatDate } from "@/lib/admin";

const MAX_PHOTO_MB = 5;
const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

const Field = ({ label, id, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-700">
      {label}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const ProfileSection = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.user);
  const [form, setForm] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "", phoneNo: user?.phoneNo || "" });
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const pickPhoto = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (picked.size > MAX_PHOTO_MB * 1024 * 1024) return toast.error(`Photo must be smaller than ${MAX_PHOTO_MB} MB`);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.firstName.trim()) found.firstName = "First name is required";
    if (!form.lastName.trim()) found.lastName = "Last name is required";
    const digits = form.phoneNo.replace(/\D/g, "");
    if (form.phoneNo.trim() && (digits.length < 10 || digits.length > 13)) found.phoneNo = "Enter a valid 10-digit mobile number";
    setErrors(found);
    if (Object.keys(found).length) return;

    const formData = new FormData();
    for (const [key, value] of Object.entries(form)) if (value.trim()) formData.append(key, value.trim());
    if (file) formData.append("file", file);
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/v1/user/update/${user._id}`, formData, authConfig());
      dispatch(setUser(res.data.user));
      setFile(null);
      setPreview("");
      toast.success("Profile updated");
    } catch (error) {
      if (error.response?.status !== 401) toast.error(error.response?.data?.message || "Could not update your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className={`p-5 sm:p-6 ${card}`}>
      <h2 className="text-lg font-bold text-gray-900">Profile</h2>
      <p className="text-sm text-gray-500">Your name and photo as shown in the admin panel.</p>

      <div className="mt-5 flex flex-wrap items-center gap-5 border-b border-gray-100 pb-6">
        <div className="relative">
          <UserAvatar user={{ ...user, profilePic: preview || user?.profilePic }} size="h-20 w-20 text-xl" />
          <label
            title="Change photo"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-pink-600 text-white shadow-md ring-2 ring-white hover:bg-pink-700"
          >
            <Camera className="h-4 w-4" />
            <span className="sr-only">Change photo</span>
            <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
          </label>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="flex items-center gap-1.5 text-sm break-all text-gray-500">
            {user?.email}
            {user?.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" aria-label="Verified" />}
          </p>
          <p className="text-xs text-gray-400">{file ? `New photo selected: ${file.name}` : `Administrator · joined ${formatDate(user?.createdAt)}`}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name" id="firstName" error={errors.firstName}>
          <input id="firstName" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" className={`${input} h-11`} />
        </Field>
        <Field label="Last name" id="lastName" error={errors.lastName}>
          <input id="lastName" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" className={`${input} h-11`} />
        </Field>
        <Field label="Email" id="email">
          <input id="email" value={user?.email || ""} disabled className={`${input} h-11`} />
        </Field>
        <Field label="Mobile number" id="phoneNo" error={errors.phoneNo}>
          <input id="phoneNo" value={form.phoneNo} onChange={set("phoneNo")} autoComplete="tel" inputMode="tel" className={`${input} h-11`} />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </div>
    </form>
  );
};

const PasswordInput = ({ id, value, onChange, autoComplete, invalid }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        className={`${input} h-11 pr-11 ${invalid ? "border-red-400 focus:ring-red-100" : ""}`}
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
  );
};

const PasswordSection = () => {
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = "Enter your current password";
    if (form.newPassword.length < 6) found.newPassword = "Use at least 6 characters";
    else if (form.newPassword === form.currentPassword) found.newPassword = "New password must be different";
    if (form.confirmPassword !== form.newPassword) found.confirmPassword = "Passwords don't match";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/v1/user/update-password`,
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        authConfig(),
      );
      toast.success(res.data.message || "Password updated");
      setForm(EMPTY_PASSWORDS);
    } catch (error) {
      const message = error.response?.data?.message || "Could not update password";
      if (/current password/i.test(message)) setErrors({ currentPassword: message });
      else toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className={`p-5 sm:p-6 ${card}`}>
      <h2 className="text-lg font-bold text-gray-900">Change password</h2>
      <p className="text-sm text-gray-500">Use a strong password you don't use on other sites.</p>
      <div className="mt-5 max-w-xl space-y-4">
        <Field label="Current password" id="currentPassword" error={errors.currentPassword}>
          <PasswordInput id="currentPassword" value={form.currentPassword} onChange={handleChange} autoComplete="current-password" invalid={!!errors.currentPassword} />
        </Field>
        <Field label="New password" id="newPassword" error={errors.newPassword}>
          <PasswordInput id="newPassword" value={form.newPassword} onChange={handleChange} autoComplete="new-password" invalid={!!errors.newPassword} />
        </Field>
        <Field label="Confirm new password" id="confirmPassword" error={errors.confirmPassword}>
          <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" invalid={!!errors.confirmPassword} />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </button>
      </div>
    </form>
  );
};

// The admin's own profile, inside the admin panel (customers use the store's account page)
const AdminAccount = () => {
  const logout = useLogout();

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader title="My Profile" description="Your admin account details and password" />
      <ProfileSection />
      <PasswordSection />
      <div className={`flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6 ${card}`}>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Logout</h2>
          <p className="text-sm text-gray-500">Sign out of the admin panel on this browser.</p>
        </div>
        <button onClick={() => logout()} className={`${btnSecondary} text-red-600 hover:bg-red-50`}>
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
};

export default AdminAccount;
