import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { API_URL, authConfig, formatDate, fullName, loadErrorMessage, shortId } from "@/lib/admin";
import ErrorState from "@/components/admin/ErrorState";
import { formatMoney, itemPrice, paymentMethodLabel } from "@/lib/orders";
import { useStoreInfo } from "@/lib/storeSettings";

// Printable invoice for one order (opened in a new tab from the order details)
const OrderInvoice = () => {
  const { orderId } = useParams();
  const store = useStoreInfo();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_URL}/api/v1/orders/admin/${orderId}`, authConfig())
      .then((res) => !ignore && setOrder(res.data.order))
      .catch((err) => !ignore && setError(loadErrorMessage(err, "invoices")));
    return () => {
      ignore = true;
    };
  }, [orderId]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <ErrorState title="Couldn't load this invoice" message={error} onRetry={() => window.location.reload()} />
      </main>
    );
  }
  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </main>
    );
  }

  const address = order.shippingAddress;
  const subtotal = order.amount - (order.tax || 0) - (order.shipping || 0) + (order.discount || 0);
  const paid = order.status === "Paid";

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 px-4 print:hidden">
        <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      <main className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
          <div>
            <img src="/Ekart-logo.png" alt={store.name} className="w-32" />
            <p className="mt-3 max-w-64 text-sm text-gray-600">{store.address}</p>
            <p className="text-sm text-gray-600">{store.email}</p>
            <p className="text-sm text-gray-600">{store.phone}</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
            <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{shortId(order._id)}</p>
            <p className="text-sm text-gray-600">Date: {formatDate(order.createdAt)}</p>
            <p className="mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {paid ? "PAID" : order.paymentMethod === "COD" ? "CASH ON DELIVERY" : order.status.toUpperCase()}
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-gray-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Bill to</p>
            <p className="mt-1 font-semibold text-gray-900">{address?.fullName || fullName(order.user)}</p>
            {address?.address && (
              <p className="text-sm text-gray-600">
                {address.address}, {address.city}
                <br />
                {address.state} {address.zip}, {address.country}
              </p>
            )}
            {(address?.phone || order.user?.phoneNo) && <p className="text-sm text-gray-600">{address?.phone || order.user.phoneNo}</p>}
            {order.user?.email && <p className="text-sm text-gray-600">{order.user.email}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment</p>
            <p className="mt-1 font-semibold text-gray-900">{paymentMethodLabel(order)}</p>
            {order.razorpayPaymentId && <p className="font-mono text-xs text-gray-600">Payment ID: {order.razorpayPaymentId}</p>}
            <p className="text-sm text-gray-600">Order status: {order.orderStatus || "Processing"}</p>
          </div>
        </section>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Price</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.products.map((item, index) => {
              const price = itemPrice(item);
              return (
                <tr key={item.productId?._id || index}>
                  <td className="py-3 pr-3 text-gray-900">{item.productId?.productName || "Product no longer available"}</td>
                  <td className="py-3 text-right tabular-nums text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums text-gray-700">{formatMoney(price)}</td>
                  <td className="py-3 text-right font-semibold tabular-nums text-gray-900">{formatMoney(price * item.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 w-full max-w-xs space-y-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between text-gray-600">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-gray-600">
              <dt>Coupon ({order.couponCode})</dt>
              <dd className="tabular-nums">−{formatMoney(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <dt>Shipping</dt>
            <dd className="tabular-nums">{order.shipping ? formatMoney(order.shipping) : "Free"}</dd>
          </div>
          <div className="flex justify-between text-gray-600">
            <dt>Tax</dt>
            <dd className="tabular-nums">{formatMoney(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(order.amount)}</dd>
          </div>
        </dl>

        <p className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          Thank you for shopping with {store.name}. Questions about this order? Write to {store.email}.
        </p>
      </main>
    </div>
  );
};

export default OrderInvoice;
