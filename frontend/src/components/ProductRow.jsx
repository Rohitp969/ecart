import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

// Horizontally scrollable shelf of products with a heading and "View All" link
const ProductRow = ({ title, subtitle, viewAllTo, products = [], loading, extra }) => {
  const scroller = useRef(null);
  const scroll = (direction) =>
    scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  if (!loading && products.length === 0) return null;
  const items = loading ? Array.from({ length: 6 }, () => null) : products;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {extra}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
            >
              View All
            </Link>
          )}
        </div>
      </div>

      <div
        ref={scroller}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((product, index) => (
          <div
            key={product?._id ?? index}
            className="w-[calc((100%-1rem)/2.2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)]"
          >
            {product ? <ProductCard product={product} /> : <ProductCardSkeleton />}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductRow;
