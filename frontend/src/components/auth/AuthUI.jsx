import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { passwordStrength } from "@/lib/authFlow";

// Building blocks shared by the login / signup / verification / reset screens

export const AuthCard = ({ icon: Icon, title, subtitle, children, footer }) => (
  <div className="w-full max-w-md">
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      {Icon && (
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm leading-6 text-gray-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
    {footer && <div className="mt-5 text-center text-sm text-gray-600">{footer}</div>}
  </div>
);

const inputClass = (error, extra = "") =>
  `h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:bg-gray-50 ${
    error ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
  } ${extra}`;

export const AuthField = ({ label, id, error, hint, labelAction, icon: Icon, className = "", ...props }) => (
  <div className={className}>
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {labelAction}
    </div>
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />}
      <input
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass(error, Icon ? "pl-9" : "")}
        {...props}
      />
    </div>
    {error ? (
      <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
        {error}
      </p>
    ) : (
      hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
    )}
  </div>
);

const STRENGTH_COLORS = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-green-600"];

export const PasswordField = ({ label, id, error, labelAction, showStrength, value, ...props }) => {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? passwordStrength(value) : null;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClass(error, "pr-11")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {strength && value && (
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1.5 flex-1 rounded-full ${strength.score >= step ? STRENGTH_COLORS[strength.score] : "bg-gray-200"}`}
              />
            ))}
          </div>
          <span className="w-16 text-right text-xs font-medium text-gray-500">{strength.label}</span>
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export const SubmitButton = ({ loading, children, loadingText = "Please wait…", className = "", ...props }) => (
  <button
    type="submit"
    disabled={loading}
    className={`inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {loading ? loadingText : children}
  </button>
);

// Inline message box: tone = error | success | info | warning
const NOTICE_STYLES = {
  error: "bg-red-50 text-red-700",
  success: "bg-green-50 text-green-700",
  info: "bg-sky-50 text-sky-800",
  warning: "bg-amber-50 text-amber-800",
};

export const Notice = ({ tone = "error", children }) => {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-2 rounded-lg px-3 py-2.5 text-sm ${NOTICE_STYLES[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

// Six single-digit boxes; supports typing, paste, backspace and arrow keys
export const OtpInput = ({ digits, onChange, disabled, invalid, onComplete }) => {
  const refs = useRef([]);
  const focus = (index) => refs.current[Math.max(0, Math.min(digits.length - 1, index))]?.focus();

  const fill = (start, text) => {
    const next = [...digits];
    let index = start;
    for (const ch of text.replace(/\D/g, "")) {
      if (index >= next.length) break;
      next[index++] = ch;
    }
    onChange(next);
    focus(index);
    if (next.every(Boolean)) onComplete?.(next.join(""));
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="6-digit code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (refs.current[index] = el)}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={digits.length}
          aria-label={`Digit ${index + 1}`}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const text = e.target.value.replace(/\D/g, "");
            if (!text) return;
            // one digit typed, or a whole code pasted / autofilled into this box
            fill(index, text.length > 1 && digit ? text.replace(digit, "") || text : text);
          }}
          onPaste={(e) => {
            e.preventDefault();
            fill(index, e.clipboardData.getData("text"));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const next = [...digits];
              if (digit) next[index] = "";
              else if (index > 0) {
                next[index - 1] = "";
                focus(index - 1);
              }
              onChange(next);
            } else if (e.key === "ArrowLeft") focus(index - 1);
            else if (e.key === "ArrowRight") focus(index + 1);
          }}
          className={`h-12 w-full min-w-0 rounded-xl border text-center text-lg font-bold text-gray-900 outline-none transition focus:ring-2 sm:h-14 sm:text-xl ${
            invalid ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
          }`}
        />
      ))}
    </div>
  );
};
