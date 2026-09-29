import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { ExternalLink, ImageOff, Layers, Loader2, Package, PackagePlus, PackageX, Pencil, Search, Trash2, TriangleAlert } from "lucide-react";
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
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/Pagination";
import RatingBadge from "@/components/RatingBadge";
import { Skeleton } from "@/components/ui/skeleton";
import useProducts from "@/hooks/useProducts";
import { setProducts } from "@/redux/productSlice";
import { API_URL, authConfig, stockLevel } from "@/lib/admin";
import { CATEGORY_GROUPS, formatPrice, getCategory, getMrp, productImage, productInCategory } from "@/lib/catalog";

const PAGE_SIZE = 15;
const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  name: (a, b) => a.productName.localeCompare(b.productName),
  price_asc: (a, b) => a.productPrice - b.productPrice,
  price_desc: (a, b) => b.productPrice - a.productPrice,
  stock: (a, b) => (a.stock ?? Infinity) - (b.stock ?? Infinity),
  rating: (a, b) => (b.rating || 0) - (a.rating || 0),
};

const StockBadge = ({ product }) => {
  const level = stockLevel(product);
  if (level === "out")
    return <span className="whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">Out of stock</span>;
  if (level === "low")
    return <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">{product.stock} left</span>;
  return (
    <span className="whitespace-nowrap rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
      {product.stock == null ? "In stock" : `${product.stock} in stock`}
    </span>
  );
};

const ProductThumb = ({ product, className = "" }) => (
  <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 ${className}`}>
    {productImage(product) ? (
      <img src={productImage(product)} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
    ) : (
      <ImageOff className="h-5 w-5 text-gray-300" />
    )}
  </div>
);

// View / Edit / Delete; shared by the phone cards and the table (bigger tap targets below md)
const ProductActions = ({ product, onDelete, className = "" }) => (
  <div className={`flex gap-1 ${className}`}>
    <Link to={`/products/${product._id}`} target="_blank" title="View in store" aria-label="View in store"
      className="rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:p-2">
      <ExternalLink className="h-4 w-4" />
    </Link>
    <Link to={`/dashboard/products/${product._id}/edit`} title="Edit" aria-label="Edit"
      className="rounded-lg p-2.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 md:p-2">
      <Pencil className="h-4 w-4" />
    </Link>
    <button onClick={() => onDelete(product)} title="Delete" aria-label="Delete"
      className="cursor-pointer rounded-lg p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 md:p-2">
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

const SummaryTile = ({ icon, label, value, tone, active, onClick }) => {
  const Icon = icon;
  return (
  <button
    onClick={onClick}
    className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md sm:p-4 ${
      active ? "border-pink-300 ring-2 ring-pink-100" : "border-gray-100"
    }`}
  >
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0">
      <span className="block text-xl font-bold text-gray-900">{value}</span>
      <span className="block text-xs text-gray-500">{label}</span>
    </span>
  </button>
  );
};

const AdminProduct = () => {
  const { products, loading } = useProducts();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const summary = useMemo(
    () => ({
      total: products.length,
      categories: new Set(products.map((p) => getCategory(p).slug)).size,
      low: products.filter((p) => stockLevel(p) === "low").length,
      out: products.filter((p) => stockLevel(p) === "out").length,
    }),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          (!q || `${p.productName} ${p.brand} ${getCategory(p).name}`.toLowerCase().includes(q)) &&
          (!category || productInCategory(p, category)) &&
          (!stock || stockLevel(p) === stock),
      )
      .sort(SORTS[sort]);
  }, [products, search, category, stock, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  // any filter change goes back to page 1
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const deleteProduct = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      const res = await axios.delete(`${API_URL}/api/v1/product/delete/${toDelete._id}`, authConfig());
      if (res.data.success) {
        dispatch(setProducts(products.filter((p) => p._id !== toDelete._id)));
        toast.success("Product deleted");
        setToDelete(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete product");
    } finally {
      setDeleting(false);
    }
  };

  // phones: selects fill the row two-up under the search box; from sm they keep their natural width
  const selectClass =
    "min-w-0 grow basis-32 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-pink-500 sm:grow-0 sm:basis-auto";

  return (
    <div>
      <AdminPageHeader title="Products" description="Manage your catalog, prices and stock">
        <Link
          to="/dashboard/add-product"
          className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-700"
        >
          <PackagePlus className="h-4 w-4" /> Add Product
        </Link>
      </AdminPageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile icon={Package} label="Total products" value={summary.total} tone="bg-blue-50 text-blue-600"
          active={!stock} onClick={() => withReset(setStock)("")} />
        <SummaryTile icon={Layers} label="Categories" value={summary.categories} tone="bg-purple-50 text-purple-600"
          active={false} onClick={() => withReset(setCategory)("")} />
        <SummaryTile icon={TriangleAlert} label="Low stock (≤10)" value={summary.low} tone="bg-amber-50 text-amber-600"
          active={stock === "low"} onClick={() => withReset(setStock)(stock === "low" ? "" : "low")} />
        <SummaryTile icon={PackageX} label="Out of stock" value={summary.out} tone="bg-red-50 text-red-600"
          active={stock === "out"} onClick={() => withReset(setStock)(stock === "out" ? "" : "out")} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => withReset(setSearch)(e.target.value)}
              placeholder="Search by name, brand or category"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500"
            />
          </div>
          <select value={category} onChange={(e) => withReset(setCategory)(e.target.value)} className={selectClass} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORY_GROUPS.map((group) =>
              group.categories.length > 1 ? (
                <optgroup key={group.slug} label={group.name}>
                  <option value={group.slug}>All {group.name}</option>
                  {group.categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </optgroup>
              ) : (
                <option key={group.slug} value={group.slug}>{group.name}</option>
              ),
            )}
          </select>
          <select value={stock} onChange={(e) => withReset(setStock)(e.target.value)} className={selectClass} aria-label="Stock">
            <option value="">Any stock</option>
            <option value="ok">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="stock">Stock: low to high</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {/* phones: stacked cards */}
        <ul className="divide-y divide-gray-100 md:hidden">
          {loading
            ? Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="p-4">
                  <Skeleton className="h-20 w-full" />
                </li>
              ))
            : rows.map((product) => {
                const mrp = getMrp(product);
                return (
                  <li key={product._id} className="flex items-start gap-3 p-4">
                    <ProductThumb product={product} className="h-16 w-16" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/dashboard/products/${product._id}/edit`}
                        className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-pink-600"
                      >
                        {product.productName}
                      </Link>
                      <p className="truncate text-xs text-gray-500">
                        {[product.brand, getCategory(product).name].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
                        <span className="text-sm font-semibold text-gray-900">{formatPrice(product.productPrice)}</span>
                        {mrp && (
                          <span className="text-xs text-gray-400">
                            <span className="line-through">{formatPrice(mrp)}</span>{" "}
                            <span className="font-semibold text-green-600">{product.discountPercentage}% off</span>
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StockBadge product={product} />
                        {product.rating ? <RatingBadge rating={product.rating} /> : <span className="text-xs text-gray-400">No rating</span>}
                      </div>
                    </div>
                    <ProductActions product={product} onDelete={setToDelete} className="-mr-2 -mt-2 shrink-0 flex-col" />
                  </li>
                );
              })}
        </ul>

        {/* md+: table; below xl the Category and Rating columns fold into the product cell so it fits beside the sidebar */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="hidden px-3 py-3 font-semibold xl:table-cell">Category</th>
                <th className="px-3 py-3 text-right font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Stock</th>
                <th className="hidden px-3 py-3 font-semibold xl:table-cell">Rating</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <Skeleton className="h-12 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((product) => {
                    const mrp = getMrp(product);
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb product={product} className="h-12 w-12" />
                            <div className="min-w-0">
                              <Link
                                to={`/dashboard/products/${product._id}/edit`}
                                className="line-clamp-1 max-w-xs font-semibold text-gray-900 hover:text-pink-600"
                              >
                                {product.productName}
                              </Link>
                              <p className="text-xs text-gray-500">
                                {product.brand}
                                <span className="xl:hidden">
                                  {product.brand && " · "}
                                  {getCategory(product).name}
                                </span>
                              </p>
                              {product.rating ? <RatingBadge rating={product.rating} className="mt-1 xl:hidden" /> : null}
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-3 py-3 text-gray-600 xl:table-cell">{getCategory(product).name}</td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <p className="font-semibold text-gray-900">{formatPrice(product.productPrice)}</p>
                          {mrp && (
                            <p className="text-xs text-gray-400">
                              <span className="line-through">{formatPrice(mrp)}</span>{" "}
                              <span className="font-semibold text-green-600">{product.discountPercentage}% off</span>
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3"><StockBadge product={product} /></td>
                        <td className="hidden px-3 py-3 xl:table-cell">
                          {product.rating ? <RatingBadge rating={product.rating} /> : <span className="text-xs text-gray-400">No rating</span>}
                        </td>
                        <td className="px-4 py-3">
                          <ProductActions product={product} onDelete={setToDelete} className="justify-end" />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-gray-500">No products match these filters.</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            {filtered.length
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`
              : "0 products"}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription className="wrap-break-word">
              “{toDelete?.productName}” will be removed from the store along with its images. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteProduct();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProduct;
