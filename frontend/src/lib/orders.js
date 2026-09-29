// Order helpers shared by checkout, the account page and order tracking
import { FREE_SHIPPING_ABOVE, SHIPPING_FEE } from "./help";

export const TAX_RATE = 0.05;

const round2 = (n) => Math.round(n * 100) / 100;

// Same maths as the backend's createOrder, from the cart's current product prices
export const checkoutTotals = (items = []) => {
  const subtotal = items.reduce((sum, item) => sum + (item.productId?.productPrice || 0) * item.quantity, 0);
  const shipping = subtotal > FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const tax = round2(subtotal * TAX_RATE);
  return {
    subtotal,
    shipping,
    tax,
    total: round2(subtotal + shipping + tax),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

// ₹8,499 / ₹424.95: paise only when there are any
export const formatMoney = (amount = 0) =>
  `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const PAYMENT_METHOD_LABELS = { Online: "Online payment", COD: "Cash on Delivery" };
export const paymentMethodLabel = (order) => PAYMENT_METHOD_LABELS[order.paymentMethod || "Online"];

// COD orders are confirmed as soon as they're placed, online ones once paid
export const isConfirmed = (order) => order.status === "Paid" || order.paymentMethod === "COD";

// One customer-facing stage per order
export const orderStage = (order) => {
  if (order.status === "Failed") return "failed";
  if (!isConfirmed(order)) return "unpaid";
  if (order.orderStatus === "Cancelled") return "cancelled";
  if (order.orderStatus === "Delivered") return "delivered";
  if (order.orderStatus === "Shipped") return "shipped";
  return "processing";
};

export const canCancel = (order) => orderStage(order) === "processing";

// unit price when ordered; older orders fall back to today's price
export const itemPrice = (item) => item.price ?? item.productId?.productPrice ?? 0;
