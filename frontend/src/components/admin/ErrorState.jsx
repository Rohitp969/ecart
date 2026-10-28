import React from "react";
import { CloudOff, RotateCcw } from "lucide-react";

// Shown when an admin page can't load its data; inline = inside an existing card (no own border)
const ErrorState = ({ title = "Couldn't load this page", message, onRetry, inline = false, className = "" }) => (
  <div
    role="alert"
    className={`flex flex-col items-center px-6 py-12 text-center ${inline ? "" : "rounded-2xl border border-gray-100 bg-white shadow-sm"} ${className}`}
  >
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
      <CloudOff className="h-7 w-7" />
    </span>
    <p className="mt-4 font-semibold text-gray-900">{title}</p>
    {message && <p className="mt-1 max-w-md text-sm text-gray-500">{message}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <RotateCcw className="h-4 w-4" /> Try again
      </button>
    )}
  </div>
);

export default ErrorState;
