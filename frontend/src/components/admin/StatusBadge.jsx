import React from "react";
import { Ban, Banknote, CheckCircle2, Clock, PackageCheck, Truck, XCircle, Loader } from "lucide-react";

// Status always pairs color with an icon + label, never color alone
const PAYMENT = {
  Paid: { icon: CheckCircle2, className: "bg-green-50 text-green-700 ring-green-600/20" },
  Pending: { icon: Clock, className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  Failed: { icon: XCircle, className: "bg-red-50 text-red-700 ring-red-600/20" },
};
// unpaid cash-on-delivery order: payment is due at the door, not stuck
const COD_DUE = { icon: Banknote, className: "bg-sky-50 text-sky-700 ring-sky-600/20" };

const FULFILMENT = {
  Processing: { icon: Loader, className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  Shipped: { icon: Truck, className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  Delivered: { icon: PackageCheck, className: "bg-green-50 text-green-700 ring-green-600/20" },
  Cancelled: { icon: Ban, className: "bg-gray-100 text-gray-600 ring-gray-500/20" },
};

// customer-facing stage (see orderStage in lib/orders.js)
const STAGES = {
  processing: { ...FULFILMENT.Processing, label: "Processing" },
  shipped: { ...FULFILMENT.Shipped, label: "Shipped" },
  delivered: { ...FULFILMENT.Delivered, label: "Delivered" },
  cancelled: { ...FULFILMENT.Cancelled, label: "Cancelled" },
  failed: { ...PAYMENT.Failed, label: "Payment failed" },
  unpaid: { ...PAYMENT.Pending, label: "Payment pending" },
};

const Badge = ({ config, label }) => {
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

export const PaymentBadge = ({ status, method }) =>
  method === "COD" && status === "Pending" ? (
    <Badge config={COD_DUE} label="COD · Unpaid" />
  ) : (
    <Badge config={PAYMENT[status] || PAYMENT.Pending} label={status || "Pending"} />
  );

export const FulfilmentBadge = ({ status = "Processing" }) => (
  <Badge config={FULFILMENT[status] || FULFILMENT.Processing} label={status} />
);

export const StageBadge = ({ stage }) => <Badge config={STAGES[stage] || STAGES.processing} label={(STAGES[stage] || STAGES.processing).label} />;
