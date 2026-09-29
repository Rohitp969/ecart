import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { PackageOpen, Search } from "lucide-react";
import OrderCard from "./OrderCard";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL, authConfig, shortId } from "@/lib/admin";
import { orderStage } from "@/lib/orders";
import { setCart } from "@/redux/productSlice";

const PAGE_SIZE = 5;

// failed / abandoned online payments never became orders, so they get their own tab
const FILTERS = [
  { key: "all", label: "All orders", stages: ["processing", "shipped", "delivered", "cancelled"] },
  { key: "active", label: "Active", stages: ["processing", "shipped"] },
  { key: "delivered", label: "Delivered", stages: ["delivered"] },
  { key: "cancelled", label: "Cancelled", stages: ["cancelled"] },
  { key: "failed", label: "Failed payments", stages: ["failed", "unpaid"] },
];

const MyOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_URL}/api/v1/orders/myorder`, authConfig())
      .then((res) => !ignore && setOrders(res.data.orders))
      .catch((err) => !ignore && setError(err.response?.data?.message || "Could not load your orders"));
    return () => {
      ignore = true;
    };
  }, []);

  const counts = useMemo(() => {
    const result = {};
    for (const f of FILTERS) result[f.key] = (orders || []).filter((o) => f.stages.includes(orderStage(o))).length;
    return result;
  }, [orders]);

  const filtered = useMemo(() => {
    const stages = FILTERS.find((f) => f.key === filter).stages;
    const q = search.trim().toLowerCase().replace(/^#/, "");
    return (orders || []).filter(
      (o) =>
        stages.includes(orderStage(o)) &&
        (!q ||
          shortId(o._id).toLowerCase().includes(q) ||
          o.products.some((item) => item.productId?.productName?.toLowerCase().includes(q))),
    );
  }, [orders, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateOrder = (updated) => setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)));

  // put the order's products back in the cart (one of each) and open the cart
  const buyAgain = async (order) => {
    const productIds = [...new Set(order.products.map((item) => item.productId?._id).filter(Boolean))];
    if (!productIds.length) {
      toast.error("These products are no longer available");
      return;
    }
    setBuyingId(order._id);
    try {
      let cart;
      for (const productId of productIds) {
        const res = await axios.post(`${API_URL}/api/v1/cart/add`, { productId }, authConfig());
        cart = res.data.cart;
      }
      dispatch(setCart(cart));
      toast.success(`Added ${productIds.length} item${productIds.length > 1 ? "s" : ""} to your cart`);
      navigate("/cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add these items to your cart");
    } finally {
      setBuyingId(null);
    }
  };

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500">Track, cancel or buy your orders again</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product or order ID"
            aria-label="Search orders"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </div>
      </div>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.filter((f) => f.key !== "failed" || counts.failed > 0).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => changeFilter(f.key)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f.key ? "bg-pink-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 text-xs ${filter === f.key ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
              {orders ? counts[f.key] : "…"}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600">{error}</p>
      ) : !orders ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
          <PackageOpen className="h-14 w-14 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-900">
            {counts.all === 0 && filter === "all" && !search ? "You haven't placed any orders yet" : "No orders match"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {counts.all === 0 && filter === "all" && !search
              ? "When you place an order, it will show up here."
              : "Try a different filter or search."}
          </p>
          <Link to="/products" className="mt-5 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onUpdated={updateOrder}
              onBuyAgain={buyAgain}
              buyingAgain={buyingId === order._id}
            />
          ))}
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} className="pt-2" />
        </div>
      )}
    </div>
  );
};

export default MyOrders;
