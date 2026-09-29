import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatPrice, productInCategory } from "../lib/catalog";

const PROMOS = [
  {
    category: "laptops",
    title: "Laptops for work & play",
    image: "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp",
    bg: "from-sky-100 to-indigo-100",
  },
  {
    category: "watches",
    title: "Watches that stand out",
    image: "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/1.webp",
    bg: "from-amber-100 to-orange-100",
  },
  {
    category: "beauty",
    title: "Beauty & fragrances",
    image: "https://cdn.dummyjson.com/product-images/fragrances/dior-j'adore/1.webp",
    bg: "from-pink-100 to-rose-100",
  },
];

const PromoBanners = ({ products = [] }) => {
  const startingPrices = useMemo(
    () =>
      PROMOS.map((promo) => {
        const prices = products.filter((p) => productInCategory(p, promo.category)).map((p) => p.productPrice);
        return prices.length ? Math.min(...prices) : null;
      }),
    [products],
  );

  return (
    // 3 across only from lg: at md a third of the row is too narrow for the title + image (text got clipped)
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PROMOS.map((promo, index) => (
        <Link
          key={promo.category}
          to={`/products?category=${promo.category}`}
          className={`group relative flex h-44 items-center overflow-hidden rounded-2xl bg-gradient-to-br ${promo.bg} p-6 shadow-sm transition hover:shadow-lg ${
            index === PROMOS.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
          }`}
        >
          <div className="relative z-10 max-w-[55%]">
            <h3 className="text-lg font-bold leading-snug text-gray-900">{promo.title}</h3>
            {startingPrices[index] && (
              <p className="mt-1 text-sm text-gray-600">
                From <span className="font-bold text-pink-600">{formatPrice(startingPrices[index])}</span>
              </p>
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 group-hover:gap-2 group-hover:text-pink-600">
              Shop now <ArrowRight className="h-4 w-4 transition-all" />
            </span>
          </div>
          <img
            src={promo.image}
            alt=""
            loading="lazy"
            className="absolute -right-2 bottom-0 h-40 w-40 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
      ))}
    </section>
  );
};

export default PromoBanners;
