import React, { useState } from "react";
import { Check, Search, Star } from "lucide-react";
import { CATEGORY_GROUPS, getCategory } from "../lib/catalog";

const PRICE_PRESETS = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹2,000", min: 500, max: 2000 },
  { label: "₹2,000 – ₹10,000", min: 2000, max: 10000 },
  { label: "₹10,000 – ₹50,000", min: 10000, max: 50000 },
  { label: "Above ₹50,000", min: 50000, max: 0 },
];
const RATING_OPTIONS = [4, 3];
const DISCOUNT_OPTIONS = [10, 20, 30, 40];
const BRANDS_SHOWN = 8;

const Section = ({ title, children }) => (
  <div className="border-b border-gray-100 py-4 last:border-b-0">
    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h3>
    {children}
  </div>
);

const Option = ({ checked, onChange, children, count, type = "checkbox" }) => (
  <label className="flex cursor-pointer items-center gap-2.5 rounded-md py-1.5 text-sm text-gray-700 hover:text-gray-900 lg:py-1">
    <input type={type} checked={checked} onChange={onChange} className="peer sr-only" />
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center border transition peer-focus-visible:ring-2 peer-focus-visible:ring-pink-400 ${
        type === "radio" ? "rounded-full" : "rounded"
      } ${checked ? "border-pink-600 bg-pink-600 text-white" : "border-gray-300 bg-white"}`}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
    <span className="min-w-0 flex-1 wrap-break-word">{children}</span>
    {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
  </label>
);

const CategoryButton = ({ active, onClick, children, count, indent }) => (
  <button
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition lg:py-1.5 ${
      indent ? "pl-5" : ""
    } ${active ? "bg-pink-50 font-semibold text-pink-700" : "text-gray-700 hover:bg-gray-50"}`}
  >
    <span>{children}</span>
    {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
  </button>
);

// Remounted (via key) whenever the applied price changes, so the inputs always match the URL
const CustomPrice = ({ min, max, onApply }) => {
  const [low, setLow] = useState(min || "");
  const [high, setHigh] = useState(max || "");
  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const lo = Math.max(0, Number(low) || 0);
        const hi = Math.max(0, Number(high) || 0);
        onApply(hi && lo > hi ? hi : lo, hi && lo > hi ? lo : hi);
      }}
    >
      <input
        type="number"
        min="0"
        placeholder="Min"
        value={low}
        onChange={(e) => setLow(e.target.value)}
        className="w-full min-w-0 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-pink-500"
      />
      <span className="text-gray-400">–</span>
      <input
        type="number"
        min="0"
        placeholder="Max"
        value={high}
        onChange={(e) => setHigh(e.target.value)}
        className="w-full min-w-0 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-pink-500"
      />
      <button
        type="submit"
        className="shrink-0 cursor-pointer rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
      >
        Go
      </button>
    </form>
  );
};

const FilterSidebar = ({ filters, update, categoryCounts, totalCount, brandFacets, extraCategories, onClearAll }) => {
  const [brandQuery, setBrandQuery] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);

  const activeGroup = filters.category
    ? CATEGORY_GROUPS.find((g) => g.slug === filters.category) ||
      getCategory({ category: filters.category }).group
    : null;

  const toggleBrand = (brand) =>
    update({
      brand: filters.brands.includes(brand) ? filters.brands.filter((b) => b !== brand) : [...filters.brands, brand],
    });

  const matchingBrands = brandFacets.filter(([brand]) => brand.toLowerCase().includes(brandQuery.toLowerCase()));
  const visibleBrands = showAllBrands || brandQuery ? matchingBrands : matchingBrands.slice(0, BRANDS_SHOWN);
  // keep checked brands visible even if they fall outside the first few
  const hiddenChecked = filters.brands.filter((b) => !visibleBrands.some(([brand]) => brand === b));

  return (
    <div className="rounded-2xl bg-white px-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 py-4">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        <button onClick={onClearAll} className="cursor-pointer text-sm font-semibold text-pink-600 hover:underline">
          Clear all
        </button>
      </div>

      <Section title="Categories">
        <CategoryButton active={!filters.category} onClick={() => update({ category: "" })} count={totalCount}>
          All Products
        </CategoryButton>
        {CATEGORY_GROUPS.map((group) => {
          const count = categoryCounts.get(group.slug) || 0;
          if (!count) return null;
          const expanded = activeGroup?.slug === group.slug && group.categories.length > 1;
          return (
            <div key={group.slug}>
              <CategoryButton
                active={filters.category === group.slug}
                onClick={() => update({ category: group.slug })}
                count={count}
              >
                {group.name}
              </CategoryButton>
              {expanded &&
                group.categories.map((category) =>
                  categoryCounts.get(category.slug) ? (
                    <CategoryButton
                      key={category.slug}
                      indent
                      active={filters.category === category.slug}
                      onClick={() => update({ category: category.slug })}
                      count={categoryCounts.get(category.slug)}
                    >
                      {category.name}
                    </CategoryButton>
                  ) : null,
                )}
            </div>
          );
        })}
        {extraCategories.map((category) => (
          <CategoryButton
            key={category.slug}
            active={filters.category === category.slug}
            onClick={() => update({ category: category.slug })}
            count={categoryCounts.get(category.slug)}
          >
            {category.name}
          </CategoryButton>
        ))}
      </Section>

      <Section title="Price">
        <div className="space-y-0.5">
          {PRICE_PRESETS.map((preset) => {
            const checked = filters.min === preset.min && filters.max === preset.max;
            return (
              <Option
                key={preset.label}
                type="radio"
                checked={checked}
                onChange={() => update(checked ? { min: 0, max: 0 } : { min: preset.min, max: preset.max })}
              >
                {preset.label}
              </Option>
            );
          })}
        </div>
        <CustomPrice
          key={`${filters.min}-${filters.max}`}
          min={filters.min}
          max={filters.max}
          onApply={(min, max) => update({ min, max })}
        />
      </Section>

      {brandFacets.length > 0 && (
        <Section title="Brand">
          {brandFacets.length > BRANDS_SHOWN && (
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Search brand"
                className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-pink-500"
              />
            </div>
          )}
          <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
            {hiddenChecked.map((brand) => (
              <Option key={brand} checked onChange={() => toggleBrand(brand)} count={0}>
                {brand}
              </Option>
            ))}
            {visibleBrands.map(([brand, count]) => (
              <Option
                key={brand}
                checked={filters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                count={count}
              >
                {brand}
              </Option>
            ))}
            {matchingBrands.length === 0 && <p className="py-1 text-sm text-gray-400">No brand found</p>}
          </div>
          {!brandQuery && brandFacets.length > BRANDS_SHOWN && (
            <button
              onClick={() => setShowAllBrands((v) => !v)}
              className="mt-2 cursor-pointer text-sm font-semibold text-pink-600 hover:underline"
            >
              {showAllBrands ? "Show less" : `+ ${brandFacets.length - BRANDS_SHOWN} more`}
            </button>
          )}
        </Section>
      )}

      <Section title="Customer Ratings">
        {RATING_OPTIONS.map((value) => (
          <Option
            key={value}
            type="radio"
            checked={filters.rating === value}
            onChange={() => update({ rating: filters.rating === value ? 0 : value })}
          >
            <span className="inline-flex items-center gap-1">
              {value}
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> & above
            </span>
          </Option>
        ))}
      </Section>

      <Section title="Discount">
        {DISCOUNT_OPTIONS.map((value) => (
          <Option
            key={value}
            type="radio"
            checked={filters.discount === value}
            onChange={() => update({ discount: filters.discount === value ? 0 : value })}
          >
            {value}% or more
          </Option>
        ))}
      </Section>

      <Section title="Availability">
        <Option checked={filters.inStock} onChange={() => update({ inStock: !filters.inStock })}>
          Exclude out of stock
        </Option>
      </Section>
    </div>
  );
};

export default FilterSidebar;
