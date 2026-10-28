// Home page banners managed from Admin → Banners. Until the admin adds some (or if the API can't be
// reached) the store shows the built-in ones below.
import { useSyncExternalStore } from "react";
import axios from "axios";

// colour presets an admin picks from (full class names, so Tailwind keeps them)
export const HERO_THEMES = {
  violet: { label: "Violet", className: "from-indigo-700 via-purple-700 to-pink-600" },
  midnight: { label: "Midnight", className: "from-slate-900 via-slate-800 to-cyan-700" },
  sunset: { label: "Sunset", className: "from-rose-600 via-pink-600 to-orange-500" },
  ocean: { label: "Ocean", className: "from-emerald-700 via-teal-600 to-sky-600" },
};
export const PROMO_THEMES = {
  sky: { label: "Sky", className: "from-sky-100 to-indigo-100" },
  amber: { label: "Amber", className: "from-amber-100 to-orange-100" },
  rose: { label: "Rose", className: "from-pink-100 to-rose-100" },
  mint: { label: "Mint", className: "from-emerald-100 to-teal-100" },
};
export const THEMES = { hero: HERO_THEMES, promo: PROMO_THEMES };

const DEFAULT_HERO = [
  {
    _id: "default-mobiles",
    eyebrow: "Mobiles Sale",
    title: "Latest smartphones at the best prices",
    text: "iPhone, Samsung, Oppo, Vivo, Realme and more — top brands, all in one place.",
    buttonText: "Shop Mobiles",
    link: "/products?category=mobiles",
    image: { url: "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/1.webp" },
    theme: "violet",
  },
  {
    _id: "default-audio",
    eyebrow: "Audio Fest",
    title: "Sound that moves you",
    text: "AirPods, Beats and smart speakers for music, calls and everything in between.",
    buttonText: "Shop Audio",
    link: "/products?category=audio",
    image: { url: "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp" },
    theme: "midnight",
  },
  {
    _id: "default-fashion",
    eyebrow: "Fashion Store",
    title: "Step up your style",
    text: "Sneakers, dresses, shirts, watches and bags — fresh trends every week.",
    buttonText: "Explore Fashion",
    link: "/products?category=fashion",
    image: { url: "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp" },
    theme: "sunset",
  },
  {
    _id: "default-home",
    eyebrow: "Home & Kitchen",
    title: "Make your home a happier place",
    text: "Furniture, decor and kitchen essentials for every room.",
    buttonText: "Shop Home",
    link: "/products?category=home-kitchen",
    image: { url: "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/1.webp" },
    theme: "ocean",
  },
];

const DEFAULT_PROMO = [
  {
    _id: "default-laptops",
    title: "Laptops for work & play",
    link: "/products?category=laptops",
    image: { url: "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp" },
    theme: "sky",
  },
  {
    _id: "default-watches",
    title: "Watches that stand out",
    link: "/products?category=watches",
    image: { url: "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/1.webp" },
    theme: "amber",
  },
  {
    _id: "default-beauty",
    title: "Beauty & fragrances",
    link: "/products?category=beauty",
    image: { url: "https://cdn.dummyjson.com/product-images/fragrances/dior-j'adore/1.webp" },
    theme: "rose",
  },
];

// category slug in a "/products?category=…" link (used for the live "Up to X% off" / "From ₹…" lines)
export const linkCategory = (link = "") => new URLSearchParams(link.split("?")[1] || "").get("category");

export const isExternalLink = (link = "") => /^https?:\/\//i.test(link);

// null while loading, then { hero, promo }
let current = null;
let requested = false;
const listeners = new Set();

const publish = (banners) => {
  const placed = (placement, fallback) => {
    const list = banners.filter((b) => b.placement === placement);
    return list.length ? list : fallback;
  };
  current = { hero: placed("hero", DEFAULT_HERO), promo: placed("promo", DEFAULT_PROMO) };
  listeners.forEach((listener) => listener());
};

const load = () => {
  if (requested) return;
  requested = true;
  axios
    .get(`${import.meta.env.VITE_API_URL}/api/v1/banners`)
    .then((res) => publish(res.data.success ? res.data.banners : []))
    .catch(() => publish([]));
};

const subscribe = (listener) => {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
};

export const useBanners = () => useSyncExternalStore(subscribe, () => current);
