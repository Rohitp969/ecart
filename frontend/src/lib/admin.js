// Shared helpers for the admin panel
import axios from "axios";
import { toast } from "sonner";

export const API_URL = import.meta.env.VITE_API_URL;

// axios config with the logged-in user's token
export const authConfig = (config = {}) => ({
  ...config,
  headers: { ...config.headers, Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
});

export const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];
export const PAYMENT_STATUSES = ["Paid", "Pending", "Failed"];

// PUT the new fulfilment status; resolves to the updated order, or null (after a toast) on failure
export const saveOrderStatus = async (orderId, orderStatus) => {
  try {
    const res = await axios.put(`${API_URL}/api/v1/orders/${orderId}/status`, { orderStatus }, authConfig());
    toast.success(res.data.message);
    return res.data.order;
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not update order");
    return null;
  }
};

export const shortId = (id = "") => `#${String(id).slice(-6).toUpperCase()}`;

export const formatDate = (date, withTime = false) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "—";

// 1,284 / 12.9K / 4.2L / 1.3Cr (Indian units) for compact tiles and axis ticks
export const compactINR = (value) => {
  const n = Math.round(Number(value) || 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return `₹${n}`;
};

export const fullName = (user) => (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Deleted user");

export const initials = (user) =>
  `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "?";

// % change vs the previous period; null when there is nothing to compare against
export const percentChange = (current, previous) => {
  if (previous === null || previous === undefined) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
};

// stock bucket used by product tables and filters
export const stockLevel = (product) => {
  if (product.stock === 0) return "out";
  if (product.stock > 0 && product.stock <= 10) return "low";
  return "ok";
};
