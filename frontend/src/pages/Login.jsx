import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { LogIn, Mail } from "lucide-react";
import { AuthCard, AuthField, Notice, PasswordField, SubmitButton } from "@/components/auth/AuthUI";
import { setUser } from "../redux/userSlice";
import { redirectAfterLogin } from "../lib/auth";
import { EMAIL_RE, authErrorMessage, clearVerifyState, codeTimers, saveVerifyState } from "../lib/authFlow";

const API = `${import.meta.env.VITE_API_URL}/api/v1/user`;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  // page that sent the user here (protected page, add-to-cart, "Sign In" button)
  const from = location.state?.from;

  const [formData, setFormData] = useState({ email: location.state?.email || "", password: "" });
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
    const found = {};
    if (!EMAIL_RE.test(formData.email.trim())) found.email = "Enter a valid email address";
    if (!formData.password) found.password = "Enter your password";
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    setFormError("");
    try {
      const res = await axios.post(`${API}/login`, { email: formData.email.trim(), password: formData.password });
      // token first, so the page we land on can use it immediately
      localStorage.setItem("accessToken", res.data.accessToken);
      dispatch(setUser(res.data.user));
      toast.success(res.data.message);
      // admins land in the admin panel, customers go back to where they were
      navigate(redirectAfterLogin(res.data.user, from), { replace: true });
    } catch (error) {
      const data = error.response?.data;
      if (data?.needsVerification) {
        // right password, email not verified yet: go enter the 6-digit code
        clearVerifyState();
        saveVerifyState({
          email: data.email,
          verifyToken: data.verifyToken,
          from,
          // no new code when one went out under 30s ago (it's still valid); none at all if the mail failed
          ...(data.codeSent
            ? codeTimers(data)
            : data.resendIn
              ? { resendAt: Date.now() + data.resendIn * 1000, expiresAt: Date.now() + ((data.expiresIn ?? 300) - 30 + data.resendIn) * 1000 }
              : { emailFailed: true, resendAt: 0 }),
        });
        navigate("/verify", { state: { notice: data.codeSent || data.resendIn ? data.message : undefined } });
      } else setFormError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to track your orders, use saved addresses and check out faster."
      footer={
        <>
          New to Ekart?{" "}
          <Link to="/signup" state={{ from }} className="font-semibold text-pink-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submitHandler} noValidate className="space-y-4">
        {formError && <Notice>{formError}</Notice>}

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
        />
        <PasswordField
          label="Password"
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          labelAction={
            <Link to="/forgot-password" state={{ email: formData.email.trim() }} className="text-sm font-semibold text-pink-600 hover:underline">
              Forgot password?
            </Link>
          }
        />

        <SubmitButton loading={loading} loadingText="Logging in…">
          Log in
        </SubmitButton>
      </form>
    </AuthCard>
  );
};

export default Login;
