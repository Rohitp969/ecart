import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { BadgeCheck, Camera, Loader2 } from "lucide-react";
import { setUser } from "@/redux/userSlice";
import { API_URL, authConfig, initials } from "@/lib/admin";

const FIELDS = ["firstName", "lastName", "phoneNo", "address", "city", "zipCode"];
const MAX_PHOTO_MB = 5;

const validate = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  const phoneDigits = form.phoneNo.replace(/\D/g, "");
  if (form.phoneNo.trim() && (phoneDigits.length < 10 || phoneDigits.length > 13)) errors.phoneNo = "Enter a valid 10-digit mobile number";
  if (form.zipCode.trim() && !/^[A-Za-z0-9\s-]{3,10}$/.test(form.zipCode.trim())) errors.zipCode = "Enter a valid PIN code";
  return errors;
};

const Field = ({ label, id, error, className = "", ...props }) => (
  <div className={className}>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={id}
      name={id}
      aria-invalid={!!error}
      className={`h-11 w-full rounded-lg border px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 read-only:bg-gray-50 read-only:text-gray-500 focus:ring-2 ${
        error ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
      }`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const ProfileForm = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.user);
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((key) => [key, user?.[key] || ""])));
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (selected.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`Photo must be smaller than ${MAX_PHOTO_MB} MB`);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    // only send filled-in fields (FormData would otherwise send the text "undefined")
    const formData = new FormData();
    for (const key of FIELDS) {
      if (form[key].trim()) formData.append(key, form[key].trim());
    }
    if (file) formData.append("file", file);

    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/v1/user/update/${user._id}`, formData, authConfig());
      dispatch(setUser(res.data.user));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setFile(null);
      setPreview("");
      toast.success(res.data.message || "Profile updated");
    } catch (error) {
      if (error.response?.status !== 401) toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const photo = preview || user?.profilePic;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-bold text-gray-900">Profile Information</h1>
      <p className="text-sm text-gray-500">Your details are used for delivery and order updates.</p>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-5 border-b border-gray-100 pb-6">
          <div className="relative">
            {photo ? (
              <img src={photo} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-pink-50" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-2xl font-bold text-white ring-4 ring-pink-50">
                {initials(user)}
              </span>
            )}
            <label
              htmlFor="profile-photo"
              title="Change photo"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-pink-600 text-white shadow-md ring-2 ring-white hover:bg-pink-700"
            >
              <Camera className="h-4 w-4" />
              <span className="sr-only">Change photo</span>
            </label>
            <input id="profile-photo" type="file" accept="image/*" onChange={handleFile} className="sr-only" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500">{file ? `New photo selected: ${file.name}` : `JPG or PNG, up to ${MAX_PHOTO_MB} MB`}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="First name" id="firstName" autoComplete="given-name" value={form.firstName} onChange={handleChange} error={errors.firstName} />
          <Field label="Last name" id="lastName" autoComplete="family-name" value={form.lastName} onChange={handleChange} error={errors.lastName} />
          <div>
            <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              Email
              {user?.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </label>
            <input
              id="email"
              value={user?.email || ""}
              readOnly
              className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 outline-none"
            />
          </div>
          <Field
            label="Mobile number"
            id="phoneNo"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={form.phoneNo}
            onChange={handleChange}
            error={errors.phoneNo}
          />
          <Field
            label="Address"
            id="address"
            autoComplete="street-address"
            placeholder="House no., building, street, area"
            value={form.address}
            onChange={handleChange}
            className="sm:col-span-2"
          />
          <Field label="City" id="city" autoComplete="address-level2" value={form.city} onChange={handleChange} />
          <Field
            label="PIN code"
            id="zipCode"
            inputMode="numeric"
            autoComplete="postal-code"
            value={form.zipCode}
            onChange={handleChange}
            error={errors.zipCode}
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">Used to pre-fill your first delivery address. Manage all delivery addresses under Saved Addresses.</p>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProfileForm;
