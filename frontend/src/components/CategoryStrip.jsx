import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ALL_CATEGORIES, getCategory, productImage } from "../lib/catalog";

const ITEM_CLASS = "flex w-20 shrink-0 flex-col items-center lg:w-auto lg:min-w-0 lg:flex-1";
const CIRCLE_SIZE = "h-16 w-16 lg:h-14 lg:w-14 xl:h-16 xl:w-16";

// Round category shortcuts; each uses the image of its best-rated product
const CategoryStrip = ({ products = [], loading }) => {
  const categories = useMemo(() => {
    const best = new Map();
    for (const product of products) {
      const slug = getCategory(product).slug;
      const current = best.get(slug);
      if (productImage(product) && (!current || (product.rating || 0) > (current.rating || 0))) {
        best.set(slug, product);
      }
    }
    return ALL_CATEGORIES.filter((c) => best.has(c.slug)).map((c) => ({ ...c, image: productImage(best.get(c.slug)) }));
  }, [products]);

  return (
    <section className="rounded-2xl bg-white px-2 py-4 shadow-sm">
      {/* phones/tablets: swipeable strip; lg+: all ~16 categories share one row (smaller circles at lg so they don't overlap) */}
      <div className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:justify-between lg:gap-0">
        {loading
          ? Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={`${ITEM_CLASS} gap-2`}>
                <Skeleton className={`${CIRCLE_SIZE} rounded-full`} />
                <Skeleton className="h-3 w-14" />
              </div>
            ))
          : [
              <Link key="all" to="/products" className={`group ${ITEM_CLASS} gap-2 text-center`}>
                <span
                  className={`flex ${CIRCLE_SIZE} items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white transition group-hover:scale-105`}
                >
                  <LayoutGrid className="h-7 w-7 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                </span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-pink-600 lg:text-[11px] xl:text-xs">All</span>
              </Link>,
              ...categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className={`group ${ITEM_CLASS} gap-2 text-center`}
                >
                  <span
                    className={`flex ${CIRCLE_SIZE} items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-2 ring-transparent transition group-hover:scale-105 group-hover:ring-pink-500`}
                  >
                    <img
                      src={category.image}
                      alt=""
                      loading="lazy"
                      className="h-12 w-12 object-contain mix-blend-multiply lg:h-10 lg:w-10 xl:h-12 xl:w-12"
                    />
                  </span>
                  <span className="text-xs font-medium leading-tight text-gray-700 group-hover:text-pink-600 lg:text-[11px] xl:text-xs">
                    {category.name}
                  </span>
                </Link>
              )),
            ]}
      </div>
    </section>
  );
};

export default CategoryStrip;
