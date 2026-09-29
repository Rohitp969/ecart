import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { Ban, Banknote, BadgeCheck, Check, Loader2, MapPin, PackageCheck, PackageSearch, Search, ShoppingBag, Truck, XCircle } from "lucide-react";
import HelpLayout, { HelpCard } from "@/components/HelpLayout";
import { FulfilmentBadge, PaymentBadge } from "@/components/admin/StatusBadge";
import { API_URL, authConfig, formatDate, shortId } from "@/lib/admin";
import { EMAIL_RE } from "@/lib/help";
import { formatMoney, isConfirmed, paymentMethodLabel } from "@/lib/orders";

const STEPS = [
  { label: "Order placed", icon: ShoppingBag, dateKey: "createdAt" },
  { label: "Confirmed", icon: BadgeCheck },
  { label: "Shipped", icon: Truck, dateKey: "shippedAt" },
  { label: "Delivered", icon: PackageCheck, dateKey: "deliveredAt" },
];

// how far along the order is: index of the last completed step
const currentStep = (order) => {
  if (!isConfirmed(order)) return 0;
  if (order.orderStatus === "Delivered") return 3;
  if (order.orderStatus === "Shipped") return 2;
  return 1;
};

const StatusNotice = ({ order }) => {
  if (order.status === "Failed") {
    return (
      <div className="flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
        <XCircle className="h-5 w-5 shrink-0" />
        Payment for this order failed, so it won't be shipped. If money was deducted, it will be refunded to your account within 5–7 business days.
      </div>
    );
  }
  if (order.orderStatus === "Cancelled") {
    return (
      <div className="flex gap-3 rounded-xl bg-gray-100 p-4 text-sm text-gray-700">
        <Ban className="h-5 w-5 shrink-0" />
        This order was cancelled
        {order.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ""}.
        {order.status === "Paid" && order.paymentMethod !== "COD"
          ? " The amount paid is refunded to the original payment method within 5–7 business days."
          : ""}
      </div>
    );
  }
  if (!isConfirmed(order)) {
    return (
      <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        <Loader2 className="h-5 w-5 shrink-0" />
        We're still waiting for the payment to be confirmed. This usually takes a few minutes.
      </div>
    );
  }
  if (order.paymentMethod === "COD" && order.status !== "Paid") {
    return (
      <div className="flex gap-3 rounded-xl bg-sky-50 p-4 text-sm text-sky-800">
        <Banknote className="h-5 w-5 shrink-0" />
        Cash on Delivery: please keep {formatMoney(order.amount)} ready in cash or UPI when your order arrives.
      </div>
    );
  }
  return null;
};

const Tracker = ({ order }) => {
  const step = currentStep(order);
  const stopped = order.status === "Failed" || order.orderStatus === "Cancelled";

  return (
    <ol className="grid grid-cols-4">
      {STEPS.map(({ label, icon, dateKey }, index) => {
        const Icon = icon;
        const done = !stopped && index <= step;
        const date = done && dateKey && order[dateKey];
        return (
          <li key={label} className="relative flex flex-col items-center text-center">
            {index > 0 && (
              <span
                className={`absolute right-1/2 top-5 h-1 w-full -translate-y-1/2 ${!stopped && index <= step ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
            <span
              className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white ${
                done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {done && index < step ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className={`mt-2 text-xs font-semibold sm:text-sm ${done ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
            {date && <span className="text-[11px] text-gray-500 sm:text-xs">{formatDate(date)}</span>}
          </li>
        );
      })}
    </ol>
  );
};

const OrderResult = ({ order }) => (
  <HelpCard>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
      <div>
        <p className="font-mono text-lg font-bold text-gray-900">Order {shortId(order._id)}</p>
        <p className="text-sm text-gray-500">
          Placed on {formatDate(order.createdAt, true)} · {paymentMethodLabel(order)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PaymentBadge status={order.status} method={order.paymentMethod} />
        {isConfirmed(order) && <FulfilmentBadge status={order.orderStatus} />}
      </div>
    </div>

    <div className="py-6">
      <Tracker order={order} />
    </div>
    <StatusNotice order={order} />
    <p className="mt-3 text-xs text-gray-400">Last updated {formatDate(order.updatedAt, true)}</p>

    <ul className="mt-4 divide-y divide-gray-50 border-t border-gray-100">
      {order.items.map((item, index) => (
        <li key={item.productId || index} className="flex items-center gap-3 py-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
            {item.image && <img src={item.image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />}
          </div>
          <div className="min-w-0 flex-1">
            {item.productId ? (
              <Link to={`/products/${item.productId}`} className="line-clamp-1 text-sm font-medium text-gray-900 hover:text-pink-600">
                {item.name}
              </Link>
            ) : (
              <p className="text-sm text-gray-500">Product no longer available</p>
            )}
            <p className="text-xs text-gray-500">Qty {item.quantity}</p>
          </div>
        </li>
      ))}
    </ul>

    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4">
      {order.shipTo ? (
        <p className="flex gap-1.5 text-sm text-gray-500">
          <MapPin className="h-4 w-4 shrink-0" />
          {order.shipTo.fullName}, {order.shipTo.city}
          {order.shipTo.state ? `, ${order.shipTo.state}` : ""} {order.shipTo.zip}
        </p>
      ) : (
        <span />
      )}
      <p className="text-sm text-gray-600">
        Total <span className="ml-1 text-lg font-bold text-gray-900">{formatMoney(order.amount)}</span>
      </p>
    </div>
  </HelpCard>
);

const TrackOrder = () => {
  const { user } = useSelector((store) => store.user);
  const [params] = useSearchParams();
  const [form, setForm] = useState({ orderId: params.get("id") || "", email: user?.email || "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [myOrders, setMyOrders] = useState([]);

  // signed-in shoppers can pick one of their own orders instead of typing the ID
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    axios
      .get(`${API_URL}/api/v1/orders/myorder`, authConfig())
      .then((res) => {
        if (!ignore) setMyOrders([...res.data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [user]);

  const track = async (orderId, email) => {
    if (!/^#?[a-f0-9]{6,24}$/i.test(orderId.trim())) {
      setError("Enter a valid order ID, like #A1B2C3");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter the email address used for the order");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/support/track-order`, { orderId: orderId.trim(), email: email.trim() });
      setOrder(res.data.order);
    } catch (err) {
      setOrder(null);
      setError(err.response?.data?.message || "Could not look up this order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    track(form.orderId, form.email);
  };

  const pickOrder = (id) => {
    const next = { orderId: shortId(id), email: user.email };
    setForm(next);
    track(next.orderId, next.email);
  };

  return (
    <HelpLayout title="Track Your Order" description="Enter your order ID and email to see where your package is." icon={PackageSearch}>
      <div className="space-y-6">
        <HelpCard>
          <form onSubmit={handleSubmit} noValidate className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label htmlFor="orderId" className="mb-1.5 block text-sm font-medium text-gray-700">
                Order ID
              </label>
              <input
                id="orderId"
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                placeholder="#A1B2C3"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 font-mono text-sm uppercase outline-none transition placeholder:normal-case focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
            <div>
              <label htmlFor="trackEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="trackEmail"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Track
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            You'll find your order ID (like #A1B2C3) under My Profile → Orders.
          </p>
        </HelpCard>

        {order && <OrderResult order={order} />}

        {user && myOrders.length > 0 && (
          <HelpCard title="Your recent orders">
            <ul className="divide-y divide-gray-100">
              {myOrders.map((o) => (
                <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-gray-900">{shortId(o._id)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(o.createdAt)} · {formatMoney(o.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentBadge status={o.status} method={o.paymentMethod} />
                    <button
                      type="button"
                      onClick={() => pickOrder(o._id)}
                      className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                    >
                      Track
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </HelpCard>
        )}

        {!user && (
          <p className="text-center text-sm text-gray-500">
            Have an account?{" "}
            <Link to="/login" state={{ from: "/track-order" }} className="font-semibold text-pink-600 hover:underline">
              Sign in
            </Link>{" "}
            to see all your orders.
          </p>
        )}
      </div>
    </HelpLayout>
  );
};

export default TrackOrder;
