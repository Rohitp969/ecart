import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  IndianRupee,
  PackageX,
  ShoppingBag,
  Table2,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/admin/StatCard";
import { FulfilmentBadge, PaymentBadge } from "@/components/admin/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL, ORDER_STATUSES, authConfig, compactINR, formatDate, percentChange, shortId } from "@/lib/admin";
import { formatPrice, getCategory } from "@/lib/catalog";

const RANGES = [
  { days: 7, label: "7D", previous: "previous 7 days" },
  { days: 30, label: "30D", previous: "previous 30 days" },
  { days: 90, label: "90D", previous: "previous 90 days" },
  { days: 365, label: "12M", previous: "previous 12 months" },
  { days: 0, label: "All time" },
];

// Chart ink (reference palette: series slot 1 + recessive chrome)
const SERIES = "#2a78d6";
const GRID = "#e5e7eb";
const MUTED = "#6b7280";

// Payment status uses the fixed status palette, always with icon + label
const PAYMENT_ROWS = [
  { name: "Paid", color: "#0ca30c", icon: CheckCircle2 },
  { name: "Pending", color: "#fab219", icon: Clock },
  { name: "Failed", color: "#d03b3b", icon: XCircle },
];

// below Tailwind's `sm` breakpoint; recharts sizes (ticks, axis width) can't use CSS classes
const PHONE_QUERY = "(max-width: 639px)";
const subscribePhone = (onChange) => {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const useIsPhone = () => useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches);

const dateLabel = (key, granularity) => {
  const date = new Date(granularity === "day" ? key : `${key}-01`);
  return granularity === "day"
    ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

const Card = ({ title, subtitle, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Empty = ({ children }) => (
  <div className="flex h-full min-h-40 items-center justify-center rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
    {children}
  </div>
);

const RevenueTooltip = ({ active, payload, granularity }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-gray-900">{dateLabel(point.date, granularity)}</p>
      <p className="mt-1 flex items-center gap-2 text-gray-700">
        <span className="h-2 w-2 rounded-full" style={{ background: SERIES }} />
        {formatPrice(point.amount)}
      </p>
      <p className="text-xs text-gray-500">
        {point.orders} paid order{point.orders === 1 ? "" : "s"}
      </p>
    </div>
  );
};

const RevenueChart = ({ data, granularity }) => {
  const [view, setView] = useState("chart");
  const isPhone = useIsPhone();
  const hasSales = data.some((d) => d.amount > 0);
  const rows = data.filter((d) => d.orders > 0);
  const tick = { fill: MUTED, fontSize: isPhone ? 11 : 12 };

  return (
    <Card
      title="Revenue"
      subtitle={`Paid orders, by ${granularity}`}
      className="lg:col-span-2"
      action={
        <div className="flex rounded-lg border border-gray-200 p-0.5">
          {[
            { key: "chart", icon: BarChart3, label: "Chart" },
            { key: "table", icon: Table2, label: "Table" },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setView(option.key)}
              aria-pressed={view === option.key}
              className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-2 text-xs font-semibold sm:px-2 sm:py-1 ${
                view === option.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <option.icon className="h-3.5 w-3.5" /> {option.label}
            </button>
          ))}
        </div>
      }
    >
      {!hasSales ? (
        <Empty>No paid orders in this period. Try a longer range.</Empty>
      ) : view === "chart" ? (
        <div className="h-60 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: isPhone ? 4 : 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => dateLabel(value, granularity)}
                tick={tick}
                tickLine={false}
                axisLine={{ stroke: "#d1d5db" }}
                minTickGap={isPhone ? 16 : 24}
              />
              <YAxis
                tickFormatter={compactINR}
                tick={tick}
                tickLine={false}
                axisLine={false}
                width={isPhone ? 44 : 56}
                tickCount={isPhone ? 4 : 5}
              />
              <Tooltip content={<RevenueTooltip granularity={granularity} />} cursor={{ stroke: "#9ca3af" }} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={SERIES}
                strokeWidth={2}
                fill={SERIES}
                fillOpacity={0.1}
                dot={data.length <= 14 ? { r: 4, fill: SERIES, stroke: "#fff", strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: SERIES, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 bg-white text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2 font-semibold">{granularity === "day" ? "Date" : "Month"}</th>
                <th className="py-2 text-right font-semibold">Paid orders</th>
                <th className="py-2 text-right font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.date}>
                  <td className="py-2 text-gray-700">{dateLabel(row.date, granularity)}</td>
                  <td className="py-2 text-right text-gray-700">{row.orders}</td>
                  <td className="py-2 text-right font-semibold text-gray-900">{formatPrice(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-400">Periods without paid orders are hidden.</p>
        </div>
      )}
    </Card>
  );
};

const OrderStatusCard = ({ paymentStatus, fulfilment }) => {
  const counts = Object.fromEntries(paymentStatus.map((s) => [s.name, s.value]));
  const total = PAYMENT_ROWS.reduce((sum, row) => sum + (counts[row.name] || 0), 0);
  const fulfilmentCounts = Object.fromEntries(fulfilment.map((s) => [s.name, s.value]));

  return (
    <Card title="Orders by status" subtitle="All orders placed in this period">
      {total === 0 ? (
        <Empty>No orders in this period.</Empty>
      ) : (
        <>
          <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Payment status split">
            {PAYMENT_ROWS.filter((row) => counts[row.name]).map((row) => (
              <div
                key={row.name}
                title={`${row.name}: ${counts[row.name]}`}
                style={{ width: `${(counts[row.name] / total) * 100}%`, background: row.color }}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {PAYMENT_ROWS.map((row) => (
              <li key={row.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <row.icon className="h-4 w-4" style={{ color: row.color }} />
                  {row.name}
                </span>
                <span className="tabular-nums text-gray-900">
                  <span className="font-semibold">{counts[row.name] || 0}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {Math.round(((counts[row.name] || 0) / total) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {/* @container: two columns only when the card itself is wide enough (it's a narrow 1/3 column at lg–xl) */}
          <div className="@container mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Fulfilment of paid orders</p>
            <div className="grid grid-cols-1 gap-2 @2xs:grid-cols-2">
              {ORDER_STATUSES.map((status) => (
                <div key={status} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-gray-50 px-2.5 py-2">
                  <FulfilmentBadge status={status} />
                  <span className="text-sm font-bold text-gray-900">{fulfilmentCounts[status] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

const CategorySales = ({ categorySales }) => {
  // merge raw stored categories ("phone", "Mobile"…) into store categories
  const rows = useMemo(() => {
    const merged = new Map();
    for (const row of categorySales) {
      const name = getCategory({ category: row.category }).name;
      const current = merged.get(name) || { name, revenue: 0, quantity: 0 };
      merged.set(name, { name, revenue: current.revenue + row.revenue, quantity: current.quantity + row.quantity });
    }
    return [...merged.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [categorySales]);
  const max = Math.max(1, ...rows.map((r) => r.revenue));

  return (
    <Card title="Sales by category" subtitle="Estimated from units sold × current price">
      {rows.length === 0 ? (
        <Empty>No paid orders in this period.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.name} title={`${row.name}: ${row.quantity} units`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-gray-700">{row.name}</span>
                <span className="shrink-0 tabular-nums text-xs text-gray-500">{row.quantity} units</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 flex-1">
                  <div
                    className="h-full rounded-r"
                    style={{ width: `${Math.max(2, (row.revenue / max) * 100)}%`, background: SERIES }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">
                  {compactINR(row.revenue)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const TopProducts = ({ products }) => {
  const max = Math.max(1, ...products.map((p) => p.quantity));
  return (
    <Card title="Top selling products" subtitle="By units sold">
      {products.length === 0 ? (
        <Empty>No sales yet in this period.</Empty>
      ) : (
        <ul className="space-y-4">
          {products.map((product, index) => (
            <li key={product.id} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-sm font-bold text-gray-400">{index + 1}</span>
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                {product.image && <img src={product.image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/products/${product.id}`} className="block truncate text-sm font-medium text-gray-800 hover:text-pink-600">
                  {product.name}
                </Link>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-blue-100">
                  <div className="h-full rounded-full" style={{ width: `${(product.quantity / max) * 100}%`, background: SERIES }} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-gray-900">{product.quantity} sold</p>
                <p className="text-xs tabular-nums text-gray-500">≈ {compactINR(product.revenue)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const RecentOrders = ({ orders }) => (
  <Card
    title="Recent orders"
    className="lg:col-span-2"
    action={
      <Link to="/dashboard/orders" className="flex items-center gap-1 text-sm font-semibold text-pink-600 hover:underline">
        View all <ArrowRight className="h-4 w-4" />
      </Link>
    }
  >
    {orders.length === 0 ? (
      <Empty>No orders yet.</Empty>
    ) : (
      // @container: stacked list while the card is narrower than the table needs (phones, and the 2/3 column at lg–xl)
      <div className="@container">
        <ul className="divide-y divide-gray-100 @2xl:hidden">
          {orders.map((order) => (
            <li key={order.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{order.customer}</p>
                <p className="text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-700">{shortId(order.id)}</span> · {order.items}{" "}
                  item{order.items === 1 ? "" : "s"} · {formatDate(order.date)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <PaymentBadge status={order.status} method={order.paymentMethod} />
                  <FulfilmentBadge status={order.orderStatus} />
                </div>
              </div>
              <p className="shrink-0 font-semibold tabular-nums text-gray-900">{formatPrice(order.amount)}</p>
            </li>
          ))}
        </ul>
        <div className="-mx-5 hidden overflow-x-auto @2xl:block">
          <table className="w-full min-w-160 text-sm">
            <thead className="border-y border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Order</th>
                <th className="px-3 py-2.5 font-semibold">Customer</th>
                <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-3 py-2.5 font-semibold">Payment</th>
                <th className="px-3 py-2.5 font-semibold">Fulfilment</th>
                <th className="px-5 py-2.5 text-right font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-900">{shortId(order.id)}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.items} item{order.items === 1 ? "" : "s"}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900">{formatPrice(order.amount)}</td>
                  <td className="px-3 py-3"><PaymentBadge status={order.status} method={order.paymentMethod} /></td>
                  <td className="px-3 py-3"><FulfilmentBadge status={order.orderStatus} /></td>
                  <td className="px-5 py-3 text-right text-gray-500">{formatDate(order.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </Card>
);

const LowStock = ({ products }) => (
  <Card
    title="Low stock"
    subtitle="10 units or fewer"
    action={<AlertTriangle className="h-5 w-5 text-amber-500" />}
  >
    {products.length === 0 ? (
      <Empty>All products are well stocked.</Empty>
    ) : (
      <ul className="space-y-3">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {product.image && <img src={product.image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />}
            </div>
            <Link
              to={`/dashboard/products/${product.id}/edit`}
              className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 hover:text-pink-600"
            >
              {product.name}
            </Link>
            {product.stock === 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                <PackageX className="h-3.5 w-3.5" /> Out
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{product.stock} left</span>
            )}
          </li>
        ))}
      </ul>
    )}
  </Card>
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  </div>
);

const AdminSales = () => {
  const { user } = useSelector((store) => store.user);
  const [range, setRange] = useState(365);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_URL}/api/v1/orders/sales`, authConfig({ params: { days: range } }))
      .then((res) => {
        if (!ignore && res.data.success) {
          setData(res.data);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.response?.data?.message || "Could not load dashboard data");
      });
    return () => {
      ignore = true;
    };
  }, [range]);

  const selected = RANGES.find((r) => r.days === range);
  // keep the previous numbers on screen (dimmed) while a new range loads
  const refreshing = data && data.days !== range;

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back${user?.firstName ? `, ${user.firstName}` : ""}. Here's how your store is doing.`}
      >
        <div className="flex w-full rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:w-auto" role="group" aria-label="Date range">
          {RANGES.map((option) => (
            <button
              key={option.days}
              onClick={() => setRange(option.days)}
              aria-pressed={range === option.days}
              className={`flex-1 cursor-pointer whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition sm:flex-none sm:px-3 sm:py-1.5 ${
                range === option.days ? "bg-pink-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </AdminPageHeader>

      {error && <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

      {!data ? (
        !error && <DashboardSkeleton />
      ) : (
        <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-50" : ""}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatPrice(data.kpis.revenue)}
              icon={IndianRupee}
              tone="blue"
              change={percentChange(data.kpis.revenue, data.previous?.revenue)}
              previousLabel={data.days ? selected?.previous : null}
              hint="From paid orders, all time"
            />
            <StatCard
              label="Paid orders"
              value={data.kpis.orders.toLocaleString("en-IN")}
              icon={ShoppingBag}
              tone="purple"
              change={percentChange(data.kpis.orders, data.previous?.orders)}
              previousLabel={data.days ? selected?.previous : null}
              hint={`${data.totals.orders} orders placed in total`}
            />
            <StatCard
              label="Avg. order value"
              value={formatPrice(data.kpis.avgOrderValue)}
              icon={Wallet}
              tone="green"
              change={percentChange(data.kpis.avgOrderValue, data.previous?.avgOrderValue)}
              previousLabel={data.days ? selected?.previous : null}
              hint="Revenue ÷ paid orders"
            />
            <StatCard
              label={data.days ? "New customers" : "Customers"}
              value={data.kpis.newCustomers.toLocaleString("en-IN")}
              icon={UserPlus}
              tone="amber"
              change={percentChange(data.kpis.newCustomers, data.previous?.newCustomers)}
              previousLabel={data.days ? selected?.previous : null}
              hint="Registered accounts"
            />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-white px-4 py-3 text-sm text-gray-600 shadow-sm ring-1 ring-gray-100">
            <span className="font-semibold text-gray-900">Store totals</span>
            <span>{formatPrice(data.totals.revenue)} revenue</span>
            <span>{data.totals.orders} orders</span>
            <span>{data.totals.users} customers</span>
            <Link to="/dashboard/products" className="hover:text-pink-600">{data.totals.products} products</Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RevenueChart data={data.salesByDate} granularity={data.granularity} />
            <OrderStatusCard paymentStatus={data.paymentStatus} fulfilment={data.fulfilment} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CategorySales categorySales={data.categorySales} />
            <TopProducts products={data.topProducts} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RecentOrders orders={data.recentOrders} />
            <LowStock products={data.lowStock} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSales;
