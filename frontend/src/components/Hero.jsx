import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice, productInCategory } from "../lib/catalog";
import { HERO_THEMES, isExternalLink, linkCategory, useBanners } from "../lib/banners";

// Offer line is computed from the live catalog so it never promises more than we sell
const offerFor = (products, category) => {
  if (!category) return null;
  const items = products.filter((p) => productInCategory(p, category));
  if (items.length === 0) return null;
  const maxDiscount = Math.max(...items.map((p) => p.discountPercentage || 0));
  if (maxDiscount >= 5) return `Up to ${maxDiscount}% off`;
  return `Starting ${formatPrice(Math.min(...items.map((p) => p.productPrice)))}`;
};

// Slides come from Admin → Banners (hero), or the built-in ones when there are none
const Hero = ({ products = [] }) => {
  const navigate = useNavigate();
  const banners = useBanners();
  const slides = useMemo(() => banners?.hero || [], [banners]);
  const [activeIndex, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const active = count ? activeIndex % count : 0;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [paused, count]);

  const offers = useMemo(() => slides.map((s) => offerFor(products, linkCategory(s.link))), [products, slides]);
  const go = (step) => setActive((i) => (i + step + count) % count);
  const open = (link) => (isExternalLink(link) ? window.open(link, "_blank", "noopener") : navigate(link || "/products"));

  if (!banners) {
    return <div className="min-h-75 animate-pulse rounded-2xl bg-gray-200 sm:min-h-85 md:min-h-95" aria-hidden />;
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide._id}
            className={`w-full shrink-0 bg-gradient-to-r ${(HERO_THEMES[slide.theme] || HERO_THEMES.violet).className} text-white`}
            aria-hidden={index !== active}
          >
            {/* sm:px-16 keeps the text clear of the prev/next arrows */}
            <div className="grid min-h-75 items-center gap-6 px-5 pt-8 pb-12 sm:min-h-85 sm:px-16 sm:py-10 md:min-h-95 md:grid-cols-2">
              <div className="min-w-0">
                {slide.eyebrow && (
                  <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                    {slide.eyebrow}
                  </span>
                )}
                <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{slide.title}</h2>
                {offers[index] && (
                  <p className="mt-3 text-lg font-bold text-yellow-300 sm:text-2xl">{offers[index]}</p>
                )}
                {slide.text && <p className="mt-3 max-w-md text-sm text-white/80 sm:text-base">{slide.text}</p>}
                <button
                  onClick={() => open(slide.link)}
                  tabIndex={index === active ? 0 : -1}
                  className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg transition hover:gap-3 hover:bg-yellow-300"
                >
                  {slide.buttonText || "Shop now"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="relative hidden justify-center md:flex">
                <div className="absolute h-72 w-72 rounded-full bg-white/15 blur-2xl" />
                <img
                  src={slide.image?.url}
                  alt=""
                  className="relative h-72 w-72 object-contain drop-shadow-2xl"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-gray-800 shadow transition hover:bg-white sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-gray-800 shadow transition hover:bg-white sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* the dot sits inside a bigger button so it is easy to tap on phones (no arrows there) */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2">
            {slides.map((slide, index) => (
              <button
                key={slide._id}
                onClick={() => setActive(index)}
                aria-label={`Go to slide ${index + 1}`}
                className="flex h-6 cursor-pointer items-center px-1"
              >
                <span
                  className={`block h-2 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2 bg-white/50"}`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Hero;
