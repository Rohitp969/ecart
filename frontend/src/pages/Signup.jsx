import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Mail, UserPlus } from "lucide-react";
import { AuthCard, AuthField, Notice, PasswordField, SubmitButton } from "@/components/auth/AuthUI";
import { EMAIL_RE, MIN_PASSWORD, authErrorMessage } from "../lib/authFlow";

const EMPTY = { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" };

const validate = (form, agreed) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Enter your first name";
  if (!form.lastName.trim()) errors.lastName = "Enter your last name";
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (form.password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters`;
  if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords don't match";
  if (!agreed) errors.terms = "Please accept the terms to continue";
  return errors;
};

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [formData, setFormData] = useState(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError("");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const found = validate(formData, agreed);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setLoading(true);
    setFormError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/register`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success("Account created! Check your email to verify it.");
      // keep the page the shopper came from, so logging in later returns them there
      navigate("/verify", { state: { email: res.data.email, from, justSent: true } });
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={UserPlus}
      title="Create your account"
      subtitle="Join Ekart to save addresses, track orders and get exclusive deals."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={{ from }} className="font-semibold text-pink-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submitHandler} noValidate className="space-y-4">
        {formError && <Notice>{formError}</Notice>}

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            label="First name"
            id="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <AuthField
            label="Last name"
            id="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
        </div>
        <AuthField
          label="Email"
          id="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          hint="We'll send a link to verify this address."
        />
        <PasswordField
          label="Password"
          id="password"
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          showStrength
        />
        <PasswordField
          label="Confirm password"
          id="confirmPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-600">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-pink-600"
            />
            <span>
              I agree to Ekart's{" "}
              <Link to="/terms" target="_blank" className="font-semibold text-pink-600 hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" target="_blank" className="font-semibold text-pink-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms}</p>}
        </div>

        <SubmitButton loading={loading} loadingText="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  );
};

export default Signup;
