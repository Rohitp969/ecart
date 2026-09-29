import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Loader2,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import CheckoutSteps from "../components/CheckoutSteps";
import { setCart } from "../redux/productSlice";
import { formatPrice, getCategory, getMrp } from "../lib/catalog";
import { FREE_SHIPPING_ABOVE, RETURN_WINDOW_DAYS } from "../lib/help";
import { checkoutTotals, formatMoney } from "../lib/orders";

const API = `${import.meta.env.VITE_API_URL}/api/v1/cart`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

// stock is optional on products; only a number limits the quantity
const stockProblem = (item) => {
  const stock = item.productId?.stock;
  if (typeof stock !== "number") return null;
  if (stock === 0) return "Out of stock — remove it to continue";
  if (item.quantity > stock) return `Only ${stock} left — lower the quantity to continue`;
  return null;
};

const ItemImage = ({ product }) => {
  const [failed, setFailed] = useState(false);
  const url = product?.productImg?.[0]?.url;
  return (
    <Link
      to={`/products/${product?._id}`}
      className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-28 sm:w-28"
    >
      {url && !failed ? (
        <img src={url} alt={product.productName} onError={() => setFailed(true)} className="h-full w-full object-contain p-2 mix-blend-multiply" />
      ) : (
        <Package className="h-8 w-8 text-gray-300" />
      )}
    </Link>
  );
};

const Cart = () => {
  const { cart } = useSelector((store) => store.product);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null); // product being updated or removed

  const items = cart?.items || [];
  // same totals as checkout and the server (free shipping above ₹299, else ₹49; 5% tax)
  const { subtotal, shipping, tax, total, itemCount } = checkoutTotals(items);
  const savings = items.reduce((sum, item) => {
    const mrp = item.productId ? getMrp(item.productId) : null;
    return mrp ? sum + (mrp - item.productId.productPrice) * item.quantity : sum;
  }, 0);
  const blocked = items.some(stockProblem);
  const toFreeShipping = FREE_SHIPPING_ABOVE + 1 - subtotal;

  // refresh from the server so prices and stock are current
  useEffect(() => {
    axios
      .get(API, { headers: authHeaders() })
      .then((res) => res.data.success && dispatch(setCart(res.data.cart)))
      .catch((error) => console.log(error));
  }, [dispatch]);

  const updateQuantity = async (productId, type) => {
    setBusyId(productId);
    try {
      const res = await axios.put(`${API}/update`, { productId, type }, { headers: authHeaders() });
      if (res.data.success) dispatch(setCart(res.data.cart));
    } catch (error) {
      if (error.response?.status !== 401) toast.error(error.response?.data?.message || "Could not update quantity");
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (productId, name) => {
    setBusyId(productId);
    try {
      const res = await axios.delete(`${API}/remove`, { headers: authHeaders(), data: { productId } });
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        toast.success(`Removed ${name ? `"${name}"` : "item"} from your cart`);
      }
    } catch (error) {
      if (error.response?.status !== 401) toast.error(error.response?.data?.message || "Could not remove this item");
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 pt-24 pb-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-pink-50">
            <ShoppingCart className="h-12 w-12 text-pink-600" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-gray-600">Looks like you haven't added anything yet. Explore our deals and find something you love.</p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
          >
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const placeOrderButton = (className = "") => (
    <button
      type="button"
      onClick={() => navigate("/address")}
      disabled={blocked}
      className={`inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      Place order <ArrowRight className="h-4 w-4" />
    </button>
  );

  return (
    <main className="min-h-screen bg-gray-50 pt-20 md:pt-24 lg:pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <CheckoutSteps current={0} />

        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">
            My Cart <span className="text-base font-medium text-gray-500">({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
          </h1>
          <Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-pink-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Link>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {/* free delivery progress */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Truck className={`h-5 w-5 ${shipping === 0 ? "text-green-600" : "text-blue-600"}`} />
                {shipping === 0 ? (
                  <span>
                    Yay! Your order gets <span className="font-semibold text-green-600">FREE delivery</span>.
                  </span>
                ) : (
                  <span>
                    Add <span className="font-semibold text-gray-900">{formatMoney(toFreeShipping)}</span> more for{" "}
                    <span className="font-semibold text-green-600">FREE delivery</span>.
                  </span>
                )}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${shipping === 0 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min(100, (subtotal / (FREE_SHIPPING_ABOVE + 1)) * 100)}%` }}
                />
              </div>
            </div>

            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {items.map((item, index) => {
                const product = item.productId;
                if (!product) return null;
                const mrp = getMrp(product);
                const problem = stockProblem(item);
                const busy = busyId === product._id;
                const atStockLimit = typeof product.stock === "number" && item.quantity >= product.stock;
                const lowStock = !problem && typeof product.stock === "number" && product.stock <= 5;

                return (
                  <li key={product._id || index} className={`flex gap-4 p-4 sm:p-5 ${busy ? "opacity-60" : ""}`}>
                    <ItemImage product={product} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={`/products/${product._id}`} className="line-clamp-2 font-semibold text-gray-900 hover:text-pink-600">
                            {product.productName}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {[product.brand, getCategory(product).name].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <p className="hidden shrink-0 text-right text-lg font-bold text-gray-900 sm:block">
                          {formatPrice(product.productPrice * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-semibold text-gray-900">{formatPrice(product.productPrice)}</span>
                        {mrp && (
                          <>
                            <span className="text-xs text-gray-400 line-through">{formatPrice(mrp)}</span>
                            <span className="text-xs font-semibold text-green-600">{Math.round(product.discountPercentage)}% off</span>
                          </>
                        )}
                      </div>

                      {problem && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" /> {problem}
                        </p>
                      )}
                      {lowStock && <p className="mt-1.5 text-xs font-semibold text-amber-600">Hurry, only {product.stock} left!</p>}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product._id, "decrease")}
                            disabled={busy || item.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-l-lg text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="flex h-9 w-10 items-center justify-center border-x border-gray-200 text-sm font-semibold tabular-nums text-gray-900">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product._id, "increase")}
                            disabled={busy || atStockLimit}
                            aria-label="Increase quantity"
                            title={atStockLimit ? "No more in stock" : undefined}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-r-lg text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="font-bold text-gray-900 sm:hidden">{formatPrice(product.productPrice * item.quantity)}</p>

                        <button
                          type="button"
                          onClick={() => removeItem(product._id, product.productName)}
                          disabled={busy}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── Price details ── */}
          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-bold text-gray-900">Price Details</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">
                  Price ({itemCount} item{itemCount !== 1 ? "s" : ""})
                </dt>
                <dd className="text-gray-900">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Delivery</dt>
                <dd className={shipping === 0 ? "font-semibold text-green-600" : "text-gray-900"}>
                  {shipping === 0 ? "FREE" : formatMoney(shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Tax (5%)</dt>
                <dd className="text-gray-900">{formatMoney(tax)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-gray-200 pt-4">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">{formatMoney(total)}</span>
            </div>

            {savings > 0 && (
              <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                You save {formatPrice(savings)} on this order
              </p>
            )}

            {blocked && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Some items aren't available in the quantity you picked. Update them to continue.
              </p>
            )}

            {placeOrderButton("mt-5 hidden w-full lg:inline-flex")}

            <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" /> Safe & secure payments via Razorpay
              </li>
              <li className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-sky-600" /> Cash on Delivery available
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-amber-600" /> {RETURN_WINDOW_DAYS}-day easy returns
              </li>
            </ul>
          </aside>
        </div>
      </div>

      {/* phones: total + place order stick to the bottom while the cart is on screen (stops above the footer) */}
      <div className="sticky bottom-0 z-30 mt-6 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-gray-900">{formatMoney(total)}</p>
            <p className="text-xs text-gray-500">Total incl. tax</p>
          </div>
          {placeOrderButton("flex-1 sm:flex-none")}
        </div>
      </div>
    </main>
  );
};

export default Cart;
