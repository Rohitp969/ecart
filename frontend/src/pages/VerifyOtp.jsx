import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { AuthCard, Notice, OtpInput, SubmitButton } from "@/components/auth/AuthUI";
import useCooldown from "../hooks/useCooldown";
import { authErrorMessage, cooldownFrom, readResetState, saveResetState } from "../lib/authFlow";

const API = `${import.meta.env.VITE_API_URL}/api/v1/user`;
const EMPTY_CODE = ["", "", "", "", "", ""];

// Step 2 of 3: enter the 6-digit code from the email
const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const saved = readResetState();
  const email = location.state?.email || saved.email;

  const [digits, setDigits] = useState(EMPTY_CODE);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, startCooldown] = useCooldown(cooldownFrom(saved.sentAt));

  if (!email) return <Navigate to="/forgot-password" replace />;

  const verify = async (code) => {
    if (code.length !== 6) {
      setError("Enter all 6 digits of the code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/verify-otp/${encodeURIComponent(email)}`, { otp: code });
      saveResetState({ email, resetToken: res.data.resetToken });
      toast.success(res.data.message);
      navigate("/reset-password", { state: { email, resetToken: res.data.resetToken }, replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setDigits(EMPTY_CODE);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    setError("");
    try {
      await axios.post(`${API}/forgot-password`, { email });
      saveResetState({ email, sentAt: Date.now(), resetToken: null });
      startCooldown(60);
      setDigits(EMPTY_CODE);
      toast.success("A new code is on its way");
    } catch (err) {
      const retryAfter = err.response?.data?.retryAfter;
      if (retryAfter) startCooldown(retryAfter);
      setError(authErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard
      icon={ShieldCheck}
      title="Enter the 6-digit code"
      subtitle={
        <>
          We sent a code to <span className="font-semibold text-gray-900">{email}</span>. It expires in 10 minutes.
        </>
      }
      footer={
        <>
          Wrong email?{" "}
          <Link to="/forgot-password" state={{ email }} className="font-semibold text-pink-600 hover:underline">
            Change it
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(digits.join(""));
        }}
        noValidate
        className="space-y-5"
      >
        {error && <Notice>{error}</Notice>}
        <OtpInput
          digits={digits}
          onChange={(next) => {
            setDigits(next);
            if (error) setError("");
          }}
          onComplete={verify}
          disabled={loading}
          invalid={Boolean(error)}
        />
        <SubmitButton loading={loading} loadingText="Verifying…">
          Verify code
        </SubmitButton>
        <div className="flex flex-col items-center gap-1 text-sm text-gray-500">
          <span>Didn't get the email? Check spam, or</span>
          <button
            type="button"
            onClick={resendCode}
            disabled={resending || secondsLeft > 0}
            className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-pink-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
            {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
};

export default VerifyOtp;
