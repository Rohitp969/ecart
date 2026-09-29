import React, { useMemo } from "react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import CategoryStrip from "../components/CategoryStrip";
import DealsOfTheDay from "../components/DealsOfTheDay";
import PromoBanners from "../components/PromoBanners";
import ProductRow from "../components/ProductRow";
import TopBrands from "../components/TopBrands";
import useProducts from "../hooks/useProducts";
import { productInCategory } from "../lib/catalog";

const SHELVES = [
  { slug: "electronics", title: "Best of Electronics", subtitle: "Mobiles, laptops, tablets & audio" },
  { slug: "fashion", title: "Trending in Fashion", subtitle: "Clothing, footwear, watches & bags" },
  { slug: "home-kitchen", title: "Home & Kitchen Essentials", subtitle: "Furniture, decor & kitchenware" },
  { slug: "beauty", title: "Beauty & Fragrances", subtitle: "Makeup, skincare & perfumes" },
  { slug: "sports", title: "Sports & Fitness", subtitle: "Gear up for every game" },
  { slug: "grocery", title: "Daily Grocery", subtitle: "Fresh fruits, vegetables & pantry staples" },
];

const byRating = (a, b) => (b.rating || 0) - (a.rating || 0);

const Home = () => {
  const { products, loading, error } = useProducts();

  const shelves = useMemo(
    () =>
      SHELVES.map((shelf) => ({
        ...shelf,
        items: products.filter((p) => productInCategory(p, shelf.slug)).sort(byRating).slice(0, 12),
      })),
    [products],
  );
  const recommended = useMemo(() => [...products].sort(byRating).slice(0, 12), [products]);

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-12 md:pt-24">
      <div className="mx-auto max-w-7xl space-y-6 px-4">
        <CategoryStrip products={products} loading={loading} />
        <Hero products={products} />
        <Features />
        {error && products.length === 0 && (
          <p className="rounded-2xl bg-red-50 p-6 text-center text-red-600">{error}</p>
        )}
        <DealsOfTheDay products={products} loading={loading} />
        <PromoBanners products={products} />
        {shelves.slice(0, 2).map((shelf) => (
          <ProductRow
            key={shelf.slug}
            title={shelf.title}
            subtitle={shelf.subtitle}
            viewAllTo={`/products?category=${shelf.slug}`}
            products={shelf.items}
            loading={loading}
          />
        ))}
        <TopBrands products={products} />
        {shelves.slice(2).map((shelf) => (
          <ProductRow
            key={shelf.slug}
            title={shelf.title}
            subtitle={shelf.subtitle}
            viewAllTo={`/products?category=${shelf.slug}`}
            products={shelf.items}
            loading={loading}
          />
        ))}
        <ProductRow
          title="Top Rated Products"
          subtitle="Loved by our customers"
          viewAllTo="/products?sort=rating"
          products={recommended}
          loading={loading}
        />
      </div>
    </main>
  );
};

export default Home;
