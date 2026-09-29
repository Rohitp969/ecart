import React, { useMemo } from "react";
import { Link } from "react-router-dom";

const HOUSE_BRANDS = ["Ekart Basics", "Ekart Fresh"];
const COLORS = [
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-purple-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-pink-500",
];

const TopBrands = ({ products = [] }) => {
  const brands = useMemo(() => {
    const counts = new Map();
    for (const { brand } of products) {
      if (brand && !HOUSE_BRANDS.includes(brand)) counts.set(brand, (counts.get(brand) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
  }, [products]);

  if (brands.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-2xl">Top Brands</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map(([brand, count], index) => (
          <Link
            key={brand}
            to={`/products?brand=${encodeURIComponent(brand)}`}
            className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-pink-200 hover:shadow-md"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${COLORS[index % COLORS.length]} text-sm font-bold text-white`}
            >
              {brand.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-800 group-hover:text-pink-600">{brand}</span>
              <span className="block text-xs text-gray-500">{count} products</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TopBrands;
