import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatPrice, productInCategory } from "../lib/catalog";
import { PROMO_THEMES, isExternalLink, linkCategory, useBanners } from "../lib/banners";

const cardClass = "group relative flex h-44 items-center overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-sm transition hover:shadow-lg";

// Promo cards come from Admin → Banners (promo), or the built-in ones when there are none
const PromoBanners = ({ products = [] }) => {
  const banners = useBanners();
  const promos = useMemo(() => banners?.promo || [], [banners]);
  const startingPrices = useMemo(
    () =>
      promos.map((promo) => {
        const category = linkCategory(promo.link);
        const prices = category ? products.filter((p) => productInCategory(p, category)).map((p) => p.productPrice) : [];
        return prices.length ? Math.min(...prices) : null;
      }),
    [products, promos],
  );

  if (!banners) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={`h-44 animate-pulse rounded-2xl bg-gray-200 ${i === 2 ? "sm:col-span-2 lg:col-span-1" : ""}`} />
        ))}
      </section>
    );
  }

  return (
    // 3 across only from lg: at md a third of the row is too narrow for the title + image (text got clipped)
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {promos.map((promo, index) => {
        const className = `${cardClass} ${(PROMO_THEMES[promo.theme] || PROMO_THEMES.sky).className} ${
          index === promos.length - 1 && promos.length % 2 === 1 ? "sm:col-span-2 lg:col-span-1" : ""
        }`;
        const content = (
          <>
            <div className="relative z-10 max-w-[55%]">
              <h3 className="text-lg font-bold leading-snug text-gray-900">{promo.title}</h3>
              {startingPrices[index] && (
                <p className="mt-1 text-sm text-gray-600">
                  From <span className="font-bold text-pink-600">{formatPrice(startingPrices[index])}</span>
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 group-hover:gap-2 group-hover:text-pink-600">
                {promo.buttonText || "Shop now"} <ArrowRight className="h-4 w-4 transition-all" />
              </span>
            </div>
            <img
              src={promo.image?.url}
              alt=""
              loading="lazy"
              className="absolute -right-2 bottom-0 h-40 w-40 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
            />
          </>
        );
        return isExternalLink(promo.link) ? (
          <a key={promo._id} href={promo.link} target="_blank" rel="noopener noreferrer" className={className}>
            {content}
          </a>
        ) : (
          <Link key={promo._id} to={promo.link || "/products"} className={className}>
            {content}
          </Link>
        );
      })}
    </section>
  );
};

export default PromoBanners;
