import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { KeyRound, Mail } from "lucide-react";
import { AuthCard, AuthField, Notice, SubmitButton } from "@/components/auth/AuthUI";
import { EMAIL_RE, authErrorMessage, cooldownFrom, readResetState, saveResetState } from "../lib/authFlow";

// Step 1 of 3: ask for the account email and send a 6-digit code
const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = readResetState();
  const [email, setEmail] = useState(location.state?.email || saved.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goToCode = (address) => navigate("/verify-otp", { state: { email: address } });

  const submitHandler = async (e) => {
    e.preventDefault();
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/forgot-password`, { email: address });
      saveResetState({ email: address, sentAt: Date.now(), resetToken: null });
      goToCode(address);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // a code was already sent for this email in this tab: let them enter it
  const hasPendingCode = saved.email && saved.email === email.trim() && cooldownFrom(saved.sentAt, 600) > 0;

  return (
    <AuthCard
      icon={KeyRound}
      title="Forgot your password?"
      subtitle="Enter the email you use for Ekart and we'll send you a 6-digit code to reset your password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-pink-600 hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      <form onSubmit={submitHandler} noValidate className="space-y-4">
        {error && <Notice>{error}</Notice>}
        <AuthField
          label="Email"
          id="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />
        <SubmitButton loading={loading} loadingText="Sending code…">
          Send code
        </SubmitButton>
        {hasPendingCode && (
          <button
            type="button"
            onClick={() => goToCode(email.trim())}
            className="w-full cursor-pointer text-center text-sm font-semibold text-pink-600 hover:underline"
          >
            I already have a code
          </button>
        )}
      </form>
    </AuthCard>
  );
};

export default ForgotPassword;
