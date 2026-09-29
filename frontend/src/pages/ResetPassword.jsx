import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";
import { AuthCard, Notice, PasswordField, SubmitButton } from "@/components/auth/AuthUI";
import { MIN_PASSWORD, authErrorMessage, clearResetState, readResetState } from "../lib/authFlow";

// Step 3 of 3: choose a new password (needs the reset token from a verified code)
const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = readResetState();
  const email = location.state?.email || saved.email;
  const resetToken = location.state?.resetToken || saved.resetToken;

  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!email || !resetToken) return <Navigate to="/forgot-password" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError("");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const found = {};
    if (formData.newPassword.length < MIN_PASSWORD) found.newPassword = `Use at least ${MIN_PASSWORD} characters`;
    if (formData.confirmPassword !== formData.newPassword) found.confirmPassword = "Passwords don't match";
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/change-password/${encodeURIComponent(email)}`, {
        ...formData,
        resetToken,
      });
      clearResetState();
      toast.success(res.data.message);
      navigate("/login", { replace: true, state: { email } });
    } catch (err) {
      setFormError(authErrorMessage(err));
      if (err.response?.status === 403) setExpired(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={LockKeyhole}
      title="Set a new password"
      subtitle={
        <>
          Choose a new password for <span className="font-semibold text-gray-900">{email}</span>.
        </>
      }
      footer={
        <Link to="/login" className="font-semibold text-pink-600 hover:underline">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={submitHandler} noValidate className="space-y-4">
        {formError && (
          <Notice>
            {formError}
            {expired && (
              <Link to="/forgot-password" state={{ email }} className="mt-1 block font-semibold underline underline-offset-2">
                Send a new code
              </Link>
            )}
          </Notice>
        )}
        <PasswordField
          label="New password"
          id="newPassword"
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          showStrength
        />
        <PasswordField
          label="Confirm new password"
          id="confirmPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <SubmitButton loading={loading} loadingText="Saving…">
          Reset password
        </SubmitButton>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
