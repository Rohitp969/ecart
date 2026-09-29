import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice, productInCategory } from "../lib/catalog";

const SLIDES = [
  {
    category: "mobiles",
    eyebrow: "Mobiles Sale",
    title: "Latest smartphones at the best prices",
    text: "iPhone, Samsung, Oppo, Vivo, Realme and more — top brands, all in one place.",
    cta: "Shop Mobiles",
    image: "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/1.webp",
    bg: "from-indigo-700 via-purple-700 to-pink-600",
  },
  {
    category: "audio",
    eyebrow: "Audio Fest",
    title: "Sound that moves you",
    text: "AirPods, Beats and smart speakers for music, calls and everything in between.",
    cta: "Shop Audio",
    image: "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp",
    bg: "from-slate-900 via-slate-800 to-cyan-700",
  },
  {
    category: "fashion",
    eyebrow: "Fashion Store",
    title: "Step up your style",
    text: "Sneakers, dresses, shirts, watches and bags — fresh trends every week.",
    cta: "Explore Fashion",
    image: "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp",
    bg: "from-rose-600 via-pink-600 to-orange-500",
  },
  {
    category: "home-kitchen",
    eyebrow: "Home & Kitchen",
    title: "Make your home a happier place",
    text: "Furniture, decor and kitchen essentials for every room.",
    cta: "Shop Home",
    image: "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/1.webp",
    bg: "from-emerald-700 via-teal-600 to-sky-600",
  },
];

// Offer line is computed from the live catalog so it never promises more than we sell
const offerFor = (products, category) => {
  const items = products.filter((p) => productInCategory(p, category));
  if (items.length === 0) return null;
  const maxDiscount = Math.max(...items.map((p) => p.discountPercentage || 0));
  if (maxDiscount >= 5) return `Up to ${maxDiscount}% off`;
  return `Starting ${formatPrice(Math.min(...items.map((p) => p.productPrice)))}`;
};

const Hero = ({ products = [] }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [paused]);

  const offers = useMemo(() => SLIDES.map((s) => offerFor(products, s.category)), [products]);
  const go = (step) => setActive((i) => (i + step + SLIDES.length) % SLIDES.length);

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
        {SLIDES.map((slide, index) => (
          <div
            key={slide.category}
            className={`w-full shrink-0 bg-gradient-to-r ${slide.bg} text-white`}
            aria-hidden={index !== active}
          >
            {/* sm:px-16 keeps the text clear of the prev/next arrows */}
            <div className="grid min-h-75 items-center gap-6 px-5 pt-8 pb-12 sm:min-h-85 sm:px-16 sm:py-10 md:min-h-95 md:grid-cols-2">
              <div className="min-w-0">
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                  {slide.eyebrow}
                </span>
                <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{slide.title}</h2>
                {offers[index] && (
                  <p className="mt-3 text-lg font-bold text-yellow-300 sm:text-2xl">{offers[index]}</p>
                )}
                <p className="mt-3 max-w-md text-sm text-white/80 sm:text-base">{slide.text}</p>
                <button
                  onClick={() => navigate(`/products?category=${slide.category}`)}
                  tabIndex={index === active ? 0 : -1}
                  className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg transition hover:gap-3 hover:bg-yellow-300"
                >
                  {slide.cta} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="relative hidden justify-center md:flex">
                <div className="absolute h-72 w-72 rounded-full bg-white/15 blur-2xl" />
                <img
                  src={slide.image}
                  alt=""
                  className="relative h-72 w-72 object-contain drop-shadow-2xl"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

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
        {SLIDES.map((slide, index) => (
          <button
            key={slide.category}
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
    </section>
  );
};

export default Hero;
