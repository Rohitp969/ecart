// Store taxonomy. A product's stored `category` is matched (case-insensitive) against each
// category's name, slug and aliases, so admin-typed values like "phone" still land in "Mobiles".
export const CATEGORY_GROUPS = [
  {
    slug: "electronics",
    name: "Electronics",
    categories: [
      { slug: "mobiles", name: "Mobiles", aliases: ["phone", "phones", "mobile", "smartphone", "smartphones"] },
      { slug: "laptops", name: "Laptops", aliases: ["laptop"] },
      { slug: "tablets", name: "Tablets", aliases: ["tablet"] },
      { slug: "audio", name: "Audio", aliases: ["headphone", "headphones", "earphones", "earbuds", "speaker", "speakers"] },
      { slug: "mobile-accessories", name: "Mobile Accessories", aliases: ["accessories", "charger", "chargers"] },
    ],
  },
  {
    slug: "fashion",
    name: "Fashion",
    categories: [
      { slug: "mens-fashion", name: "Men's Fashion", aliases: ["men", "mens", "mens-shirts", "shirts"] },
      { slug: "womens-fashion", name: "Women's Fashion", aliases: ["women", "womens", "tops", "dresses", "womens-dresses"] },
      { slug: "footwear", name: "Footwear", aliases: ["shoes", "mens-shoes", "womens-shoes"] },
      { slug: "watches", name: "Watches", aliases: ["watch", "smartwatch", "mens-watches", "womens-watches"] },
      { slug: "bags-accessories", name: "Bags & Accessories", aliases: ["bags", "jewellery", "jewelry", "sunglasses"] },
    ],
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    categories: [
      { slug: "home-furniture", name: "Home & Furniture", aliases: ["furniture", "home", "home decor", "home-decoration"] },
      { slug: "kitchen", name: "Kitchen", aliases: ["kitchen-accessories"] },
    ],
  },
  { slug: "beauty", name: "Beauty", categories: [{ slug: "beauty", name: "Beauty", aliases: ["skin-care", "skincare", "fragrances", "perfume", "makeup"] }] },
  { slug: "sports", name: "Sports", categories: [{ slug: "sports", name: "Sports", aliases: ["sports-accessories", "fitness"] }] },
  { slug: "grocery", name: "Grocery", categories: [{ slug: "grocery", name: "Grocery", aliases: ["groceries", "food"] }] },
];

const OTHER_GROUP = { slug: "more", name: "More", categories: [] };

export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((category) => ({ ...category, group })),
);

const CATEGORY_INDEX = new Map();
for (const category of ALL_CATEGORIES) {
  for (const key of [category.slug, category.name, ...category.aliases]) {
    CATEGORY_INDEX.set(key.toLowerCase(), category);
  }
}

export const slugify = (text = "") =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const getCategory = (product) => {
  const raw = (product?.category || "").trim();
  return (
    CATEGORY_INDEX.get(raw.toLowerCase()) || {
      slug: slugify(raw) || "other",
      name: raw || "Other",
      aliases: [],
      group: OTHER_GROUP,
    }
  );
};

// `slug` may be a group ("electronics") or a single category ("mobiles")
export const productInCategory = (product, slug) => {
  const category = getCategory(product);
  return category.slug === slug || category.group.slug === slug;
};

export const findCategoryOrGroup = (slug) =>
  CATEGORY_GROUPS.find((g) => g.slug === slug) || ALL_CATEGORIES.find((c) => c.slug === slug);

export const formatPrice = (amount) => `₹${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;

// MRP shown struck-through next to the selling price
export const getMrp = (product) =>
  product.discountPercentage > 0
    ? Math.round(product.productPrice / (1 - product.discountPercentage / 100))
    : null;

// stock is optional; only an explicit 0 means sold out
export const isOutOfStock = (product) => product.stock === 0;

export const productImage = (product) => product?.productImg?.[0]?.url;

// Human-readable chips for the active listing filters (shown above the product grid);
// `patch` is what removes that filter
export const describeFilters = (filters) => {
  const chips = [];
  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"`, patch: { q: "" } });
  filters.brands.forEach((brand) =>
    chips.push({ key: `brand-${brand}`, label: brand, patch: { brand: filters.brands.filter((b) => b !== brand) } }),
  );
  if (filters.min || filters.max) {
    const label = filters.max
      ? `${formatPrice(filters.min)} – ${formatPrice(filters.max)}`
      : `Above ${formatPrice(filters.min)}`;
    chips.push({ key: "price", label, patch: { min: 0, max: 0 } });
  }
  if (filters.rating) chips.push({ key: "rating", label: `${filters.rating}★ & above`, patch: { rating: 0 } });
  if (filters.discount) chips.push({ key: "discount", label: `${filters.discount}%+ off`, patch: { discount: 0 } });
  if (filters.inStock) chips.push({ key: "inStock", label: "In stock", patch: { inStock: false } });
  return chips;
};
