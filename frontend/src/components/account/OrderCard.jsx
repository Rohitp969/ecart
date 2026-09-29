import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ChevronDown, CircleHelp, Loader2, MapPin, Package, PackageSearch, RotateCcw, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StageBadge } from "@/components/admin/StatusBadge";
import { API_URL, authConfig, formatDate, shortId } from "@/lib/admin";
import { canCancel, formatMoney, itemPrice, orderStage, paymentMethodLabel } from "@/lib/orders";

const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery is taking too long",
  "Want to change the address or items",
  "Other",
];

// one line under the status badge explaining where the order is
const stageMessage = (order) => {
  const cod = order.paymentMethod === "COD";
  switch (orderStage(order)) {
    case "shipped":
      return `Shipped${order.shippedAt ? ` on ${formatDate(order.shippedAt)}` : ""} — on its way to you.${cod ? ` Pay ${formatMoney(order.amount)} on delivery.` : ""}`;
    case "delivered":
      return `Delivered${order.deliveredAt ? ` on ${formatDate(order.deliveredAt)}` : ""}. Enjoy your purchase!`;
    case "cancelled":
      return `Cancelled${order.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ""}.${
        order.status === "Paid" && !cod ? " Your refund goes back to the original payment method in 5–7 business days." : ""
      }`;
    case "failed":
      return "The payment didn't go through, so this order wasn't placed. Any amount deducted is refunded by your bank in 5–7 business days.";
    case "unpaid":
      return "The payment wasn't completed, so this order wasn't placed.";
    default:
      return cod
        ? `We're packing your order. Keep ${formatMoney(order.amount)} ready for the delivery.`
        : "We're packing your order and will ship it soon.";
  }
};

const ProductThumb = ({ product }) => {
  const [failed, setFailed] = useState(false);
  const url = product?.productImg?.[0]?.url;
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
      {url && !failed ? (
        <img src={url} alt="" onError={() => setFailed(true)} className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
      ) : (
        <Package className="h-6 w-6 text-gray-300" />
      )}
    </div>
  );
};

const actionClass =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

const OrderCard = ({ order, onUpdated, onBuyAgain, buyingAgain }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [cancelling, setCancelling] = useState(false);

  const stage = orderStage(order);
  const placed = stage !== "failed" && stage !== "unpaid";
  const address = order.shippingAddress;
  const subtotal = order.amount - (order.tax || 0) - (order.shipping || 0);
  const ref = shortId(order._id);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await axios.put(`${API_URL}/api/v1/orders/${order._id}/cancel`, { reason }, authConfig());
      toast.success(res.data.message);
      onUpdated(res.data.order);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not cancel this order");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3 sm:px-5">
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order placed</dt>
            <dd className="font-medium text-gray-900">{formatDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total</dt>
            <dd className="font-medium text-gray-900">{formatMoney(order.amount)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment</dt>
            <dd className="font-medium text-gray-900">{paymentMethodLabel(order)}</dd>
          </div>
        </dl>
        <div className="text-right text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order</p>
          <p className="font-mono font-bold text-gray-900">{ref}</p>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StageBadge stage={stage} />
          <p className="text-sm text-gray-600">{stageMessage(order)}</p>
        </div>

        <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <ul className="min-w-0 flex-1 space-y-3">
            {order.products.map((item, index) => {
              const product = item.productId;
              return (
                <li key={product?._id || index} className="flex items-center gap-3">
                  <ProductThumb product={product} />
                  <div className="min-w-0">
                    {product?._id ? (
                      <Link to={`/products/${product._id}`} className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-pink-600">
                        {product.productName}
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-500">Product no longer available</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-500">
                      Qty {item.quantity}
                      {itemPrice(item) ? ` · ${formatMoney(itemPrice(item))} each` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 flex-col gap-2 md:w-48">
            {placed && (
              <Link to={`/track-order?id=${encodeURIComponent(ref)}`} className={`${actionClass} border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100`}>
                <PackageSearch className="h-4 w-4" /> Track order
              </Link>
            )}
            {(stage === "delivered" || stage === "cancelled" || !placed) && (
              <button type="button" onClick={() => onBuyAgain(order)} disabled={buyingAgain} className={actionClass}>
                {buyingAgain ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {placed ? "Buy again" : "Try again"}
              </button>
            )}
            {canCancel(order) && (
              <button type="button" onClick={() => setConfirmOpen(true)} className={`${actionClass} text-red-600 hover:bg-red-50`}>
                <XCircle className="h-4 w-4" /> Cancel order
              </button>
            )}
            <Link to="/contact" className={actionClass}>
              <CircleHelp className="h-4 w-4" /> Need help?
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-pink-600 hover:underline"
        >
          {expanded ? "Hide details" : "Order details"}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3">
            <div className="text-sm">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">Delivery address</p>
              {address?.address ? (
                <p className="flex gap-1.5 text-gray-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span>
                    <span className="font-semibold text-gray-900">{address.fullName}</span>
                    <br />
                    {address.address}, {address.city}
                    <br />
                    {address.state} {address.zip}
                    {address.phone && (
                      <>
                        <br />
                        Phone: {address.phone}
                      </>
                    )}
                  </span>
                </p>
              ) : (
                <p className="text-gray-500">Not recorded for this order.</p>
              )}
            </div>

            <div className="text-sm">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">Payment</p>
              <p className="font-medium text-gray-900">{paymentMethodLabel(order)}</p>
              <p className="text-gray-600">
                {order.paymentMethod === "COD"
                  ? order.status === "Paid"
                    ? "Paid on delivery"
                    : stage === "cancelled"
                      ? "Nothing to pay"
                      : "Pay on delivery"
                  : order.status === "Paid"
                    ? "Paid"
                    : order.status === "Failed"
                      ? "Payment failed"
                      : "Not completed"}
              </p>
              {order.razorpayPaymentId && <p className="mt-1 break-all font-mono text-xs text-gray-500">{order.razorpayPaymentId}</p>}
              {order.cancelReason && <p className="mt-2 text-xs text-gray-500">Cancel reason: {order.cancelReason}</p>}
            </div>

            <dl className="space-y-1.5 rounded-xl bg-gray-50 p-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Items</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Shipping</dt>
                <dd>{order.shipping ? formatMoney(order.shipping) : "FREE"}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Tax (5%)</dt>
                <dd>{formatMoney(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900">
                <dt>Total</dt>
                <dd>{formatMoney(order.amount)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !cancelling && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order {ref}?</AlertDialogTitle>
            <AlertDialogDescription>
              {order.status === "Paid"
                ? `You'll get a full refund of ${formatMoney(order.amount)} to your original payment method in 5–7 business days.`
                : "Your order will be cancelled and you won't need to pay anything."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <label htmlFor={`reason-${order._id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              Why are you cancelling?
            </label>
            <select
              id={`reason-${order._id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink-500"
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                cancelOrder();
              }}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling && <Loader2 className="animate-spin" />} Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

export default OrderCard;
