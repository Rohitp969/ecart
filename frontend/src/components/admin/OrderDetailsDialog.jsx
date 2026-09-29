import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FulfilmentBadge, PaymentBadge } from "./StatusBadge";
import { ORDER_STATUSES, formatDate, fullName, shortId } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { formatMoney, isConfirmed, itemPrice, paymentMethodLabel } from "@/lib/orders";
import { cn } from "@/lib/utils";

// Fulfilment select; shipping/delivery only makes sense once the order is paid (or cash on delivery)
// cn: callers can override the size classes (e.g. bigger tap target on phones)
export const FulfilmentSelect = ({ order, onChange, disabled, className = "" }) => (
  <select
    value={order.orderStatus || "Processing"}
    onChange={(e) => onChange(order, e.target.value)}
    disabled={disabled}
    aria-label="Fulfilment status"
    className={cn(
      "cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-pink-500 disabled:opacity-50",
      className,
    )}
  >
    {ORDER_STATUSES.map((status) => (
      <option key={status} value={status} disabled={!isConfirmed(order) && (status === "Shipped" || status === "Delivered")}>
        {status}
      </option>
    ))}
  </select>
);

const Row = ({ label, value, strong }) => (
  <div className={`flex justify-between text-sm ${strong ? "border-t border-gray-100 pt-2 font-bold text-gray-900" : "text-gray-600"}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

const OrderDetailsDialog = ({ order, onClose, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);
  if (!order) return null;

  const address = order.shippingAddress;
  const subtotal = order.amount - (order.tax || 0) - (order.shipping || 0);
  const changeStatus = async (o, status) => {
    setUpdating(true);
    try {
      await onStatusChange(o, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[95vw] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        {/* pr: keep the title badges clear of the dialog's close button */}
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="flex flex-wrap items-center gap-2 leading-snug">
            Order <span className="font-mono">{shortId(order._id)}</span>
            <PaymentBadge status={order.status} method={order.paymentMethod} />
            <FulfilmentBadge status={order.orderStatus} />
          </DialogTitle>
          <DialogDescription>Placed on {formatDate(order.createdAt, true)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 text-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Customer</p>
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              <User className="h-4 w-4 shrink-0 text-gray-400" />
              {order.user?._id ? (
                <Link to={`/dashboard/users/${order.user._id}`} className="min-w-0 wrap-break-word hover:text-pink-600" onClick={onClose}>
                  {fullName(order.user)}
                </Link>
              ) : (
                "Deleted user"
              )}
            </p>
            {order.user?.email && (
              <p className="mt-1 flex items-center gap-2 break-all text-gray-600"><Mail className="h-4 w-4 shrink-0 text-gray-400" />{order.user.email}</p>
            )}
            {(address?.phone || order.user?.phoneNo) && (
              <p className="mt-1 flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 shrink-0 text-gray-400" />{address?.phone || order.user.phoneNo}</p>
            )}
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Shipping address</p>
            {address?.address ? (
              <p className="flex gap-2 text-gray-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  <span className="font-semibold text-gray-900">{address.fullName}</span>
                  <br />
                  {address.address}, {address.city}
                  <br />
                  {address.state} {address.zip}, {address.country}
                </span>
              </p>
            ) : (
              <p className="text-gray-500">Not recorded — this order was placed before addresses were saved with orders.</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Items</p>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {order.products.map((item, index) => {
              const product = item.productId;
              const price = itemPrice(item);
              return (
                <li key={product?._id || index} className="flex items-center gap-3 p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    {product?.productImg?.[0]?.url && (
                      <img src={product.productImg[0].url} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{product?.productName || "Product no longer available"}</p>
                    <p className="text-xs text-gray-500">
                      Qty {item.quantity}
                      {price ? ` × ${formatPrice(price)}` : ""}
                    </p>
                  </div>
                  {price ? (
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">{formatPrice(price * item.quantity)}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {order.products.some((item) => item.price === undefined) && (
            <p className="mt-1 text-xs text-gray-400">Item prices shown at today's price; the totals below are what the customer paid.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl bg-gray-50 p-4">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            <Row label="Tax" value={formatMoney(order.tax)} />
            <Row label="Shipping" value={order.shipping ? formatMoney(order.shipping) : "Free"} />
            <Row label="Total" value={formatMoney(order.amount)} strong />
          </div>
          <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment</p>
              <p className="mt-1 font-semibold text-gray-900">{paymentMethodLabel(order)}</p>
              {order.paymentMethod === "COD" ? (
                <p className="text-xs text-gray-600">
                  {order.status === "Paid"
                    ? "Cash collected on delivery."
                    : `Collect ${formatMoney(order.amount)} on delivery. Marking it Delivered records the payment.`}
                </p>
              ) : (
                <>
                  <p className="break-all font-mono text-xs text-gray-600">Razorpay order: {order.razorpayOrderId || "—"}</p>
                  <p className="break-all font-mono text-xs text-gray-600">Payment ID: {order.razorpayPaymentId || "—"}</p>
                </>
              )}
              {order.orderStatus === "Cancelled" && (
                <p className="mt-2 text-xs text-gray-600">
                  Cancelled by {order.cancelledBy || "admin"}
                  {order.cancelledAt ? ` on ${formatDate(order.cancelledAt, true)}` : ""}
                  {order.cancelReason ? ` — “${order.cancelReason}”` : ""}
                  {order.status === "Paid" && order.paymentMethod !== "COD" ? ". Refund this payment from the Razorpay dashboard." : ""}
                </p>
              )}
            </div>
            {onStatusChange && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Update fulfilment</p>
                <div className="flex items-center gap-2">
                  <FulfilmentSelect order={order} onChange={changeStatus} disabled={updating} className="min-w-0 flex-1 py-2 text-sm" />
                  {updating && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
                {!isConfirmed(order) && (
                  <p className="mt-1 text-xs text-gray-400">Unpaid online orders can only be kept processing or cancelled.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
