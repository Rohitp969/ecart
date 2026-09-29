import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import FilterSidebar from "../components/FilterSidebar";
import Pagination from "../components/Pagination";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";
import useProducts from "../hooks/useProducts";
import {
  ALL_CATEGORIES,
  describeFilters,
  findCategoryOrGroup,
  getCategory,
  isOutOfStock,
  productInCategory,
} from "../lib/catalog";

const PAGE_SIZE = 24;
const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Customer Rating" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount", label: "Discount" },
  { value: "newest", label: "Newest First" },
];
const CATEGORY_ORDER = new Map(ALL_CATEGORIES.map((c, i) => [c.slug, i]));

const readFilters = (params) => ({
  q: params.get("q")?.trim() || "",
  category: params.get("category") || "",
  brands: params.get("brand") ? params.get("brand").split(",").filter(Boolean) : [],
  min: Math.max(0, Number(params.get("min")) || 0),
  max: Math.max(0, Number(params.get("max")) || 0),
  rating: Number(params.get("rating")) || 0,
  discount: Number(params.get("discount")) || 0,
  inStock: params.get("inStock") === "1",
  sort: params.get("sort") || "relevance",
  page: Math.max(1, Math.floor(Number(params.get("page")) || 1)),
});

const searchText = (p) => {
  const category = getCategory(p);
  return `${p.productName} ${p.brand} ${category.name} ${category.group.name}`.toLowerCase();
};

const matchesSearch = (p, q) => {
  if (!q) return true;
  const text = searchText(p);
  return q.toLowerCase().split(/\s+/).every((word) => text.includes(word));
};

const searchScore = (p, q) => {
  const name = p.productName.toLowerCase();
  const query = q.toLowerCase();
  if (name.startsWith(query)) return 3;
  if (name.includes(query)) return 2;
  return 1;
};

// Unrated (admin-added) products are ranked as if rated 4 so they are not buried
const rankRating = (p) => p.rating || 4;

// Default listing: mix categories (best-rated of each first) so page 1 shows the whole store
const interleaveByCategory = (items) => {
  const buckets = new Map();
  for (const p of [...items].sort((a, b) => rankRating(b) - rankRating(a))) {
    const slug = getCategory(p).slug;
    if (!buckets.has(slug)) buckets.set(slug, []);
    buckets.get(slug).push(p);
  }
  const queues = [...buckets.entries()]
    .sort(([a], [b]) => (CATEGORY_ORDER.get(a) ?? 99) - (CATEGORY_ORDER.get(b) ?? 99))
    .map(([, list]) => list);
  const result = [];
  while (queues.some((q) => q.length)) queues.forEach((q) => q.length && result.push(q.shift()));
  return result;
};

const sortProducts = (items, sort, q) => {
  const list = [...items];
  switch (sort) {
    case "rating":
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "price_asc":
      return list.sort((a, b) => a.productPrice - b.productPrice);
    case "price_desc":
      return list.sort((a, b) => b.productPrice - a.productPrice);
    case "discount":
      return list.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    case "newest":
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    default:
      return q
        ? list.sort((a, b) => searchScore(b, q) - searchScore(a, q) || rankRating(b) - rankRating(a))
        : interleaveByCategory(list);
  }
};

const Products = () => {
  const { products, loading, error } = useProducts();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = readFilters(params);

  const update = (patch, { keepPage = false } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        const empty = value === "" || value === 0 || value === false || value == null || (Array.isArray(value) && !value.length);
        if (empty) next.delete(key);
        else next.set(key, Array.isArray(value) ? value.join(",") : value === true ? "1" : String(value));
      }
      if (!keepPage) next.delete("page");
      return next;
    });
  };
  const clearAll = () => setParams(filters.sort !== "relevance" ? { sort: filters.sort } : {});

  // products matching the search only: drives category counts
  const searched = useMemo(() => products.filter((p) => matchesSearch(p, filters.q)), [products, filters.q]);

  const { categoryCounts, extraCategories } = useMemo(() => {
    const counts = new Map();
    const extras = new Map();
    for (const p of searched) {
      const category = getCategory(p);
      counts.set(category.slug, (counts.get(category.slug) || 0) + 1);
      counts.set(category.group.slug, (counts.get(category.group.slug) || 0) + 1);
      if (category.group.slug === "more") extras.set(category.slug, category);
    }
    return { categoryCounts: counts, extraCategories: [...extras.values()] };
  }, [searched]);

  // search + category: drives the brand list
  const inCategory = useMemo(
    () => (filters.category ? searched.filter((p) => productInCategory(p, filters.category)) : searched),
    [searched, filters.category],
  );

  const brandFacets = useMemo(() => {
    const counts = new Map();
    for (const { brand } of inCategory) if (brand) counts.set(brand, (counts.get(brand) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [inCategory]);

  const { brands, min, max, rating, discount, inStock, sort, q } = filters;
  const results = useMemo(() => {
    const filtered = inCategory.filter(
      (p) =>
        (brands.length === 0 || brands.includes(p.brand)) &&
        p.productPrice >= min &&
        (!max || p.productPrice <= max) &&
        (!rating || (p.rating || 0) >= rating) &&
        (!discount || (p.discountPercentage || 0) >= discount) &&
        (!inStock || !isOutOfStock(p)),
    );
    return sortProducts(filtered, sort, q);
  }, [inCategory, brands, min, max, rating, discount, inStock, sort, q]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (p) => {
    update({ page: p === 1 ? 0 : p }, { keepPage: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selected = filters.category
    ? findCategoryOrGroup(filters.category) ||
      extraCategories.find((c) => c.slug === filters.category) || { name: filters.category }
    : null;
  const heading = filters.q ? `Results for "${filters.q}"` : selected?.name || "All Products";
  const chips = describeFilters(filters);

  const sidebar = (
    <FilterSidebar
      filters={filters}
      update={update}
      categoryCounts={categoryCounts}
      totalCount={searched.length}
      brandFacets={brandFacets}
      extraCategories={extraCategories}
      onClearAll={clearAll}
    />
  );

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-12 md:pt-24">
      <div className="mx-auto flex max-w-7xl gap-6 px-4">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl [scrollbar-width:thin]">
            {sidebar}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <nav className="flex items-center gap-1.5 text-xs text-gray-500">
              <Link to="/" className="hover:text-pink-600">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/products" className="hover:text-pink-600">Products</Link>
              {selected && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-gray-800">{selected.name}</span>
                </>
              )}
            </nav>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 wrap-break-word sm:text-2xl">{heading}</h1>
                <p className="text-sm text-gray-500">
                  {loading
                    ? "Loading products…"
                    : results.length
                      ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, results.length)} of ${results.length} products`
                      : "No products found"}
                </p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {chips.length + (filters.category ? 1 : 0) > 0 && (
                    <span className="rounded-full bg-pink-600 px-1.5 text-xs text-white">
                      {chips.length + (filters.category ? 1 : 0)}
                    </span>
                  )}
                </button>
                <label className="flex flex-1 items-center gap-2 text-sm text-gray-500 sm:flex-none">
                  <span className="hidden whitespace-nowrap sm:inline">Sort by</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => update({ sort: e.target.value === "relevance" ? "" : e.target.value })}
                    className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:border-pink-500 sm:w-48"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* phones only: from md up the navbar search is always visible */}
            <form
              key={filters.q}
              className="relative mt-3 md:hidden"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: new FormData(e.currentTarget).get("q").trim() });
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Search products, brands…"
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500"
              />
            </form>

            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => update(chip.patch)}
                    title={chip.label}
                    className="flex max-w-full cursor-pointer items-center gap-1 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-100"
                  >
                    <span className="truncate">{chip.label}</span> <X className="h-3 w-3 shrink-0" />
                  </button>
                ))}
                <button onClick={clearAll} className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-pink-600">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {error && products.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-red-50 p-6 text-center text-red-600">{error}</p>
          ) : loading ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <PackageSearch className="h-14 w-14 text-gray-300" />
              <h2 className="mt-4 text-lg font-bold text-gray-900">No products match your filters</h2>
              <p className="mt-1 text-sm text-gray-500">Try removing some filters or searching for something else.</p>
              <button
                onClick={() => setParams({})}
                className="mt-5 cursor-pointer rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
              >
                Show all products
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {pageItems.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={goToPage} className="mt-8" />
            </>
          )}
        </section>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-gray-50">
            <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
              <span className="font-bold text-gray-900">Filters</span>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="-mr-2 cursor-pointer rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-3">{sidebar}</div>
            <div className="bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full cursor-pointer rounded-lg bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700"
              >
                Show {results.length} products
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Products;
