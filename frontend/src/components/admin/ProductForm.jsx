import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import ProductCard from "@/components/ProductCard";
import { CATEGORY_GROUPS, formatPrice, getCategory } from "@/lib/catalog";

const toFormState = (product) => ({
  productName: product?.productName || "",
  brand: product?.brand || "",
  // normalise old free-text categories ("phone", "Mobile") to the store taxonomy
  category: product?.category ? getCategory(product).name : "",
  productDesc: product?.productDesc || "",
  productPrice: product?.productPrice ?? "",
  discountPercentage: product?.discountPercentage ?? 0,
  stock: product?.stock ?? "",
});

const validate = (values, images) => {
  const errors = {};
  if (!values.productName.trim()) errors.productName = "Product name is required";
  if (!values.brand.trim()) errors.brand = "Brand is required";
  if (!values.category) errors.category = "Choose a category";
  if (!values.productDesc.trim()) errors.productDesc = "Description is required";
  if (!(Number(values.productPrice) > 0)) errors.productPrice = "Enter a price above ₹0";
  const discount = Number(values.discountPercentage);
  if (discount < 0 || discount > 90) errors.discountPercentage = "Discount must be 0–90%";
  if (values.stock !== "" && !(Number.isInteger(Number(values.stock)) && Number(values.stock) >= 0))
    errors.stock = "Stock must be a whole number (or leave empty)";
  if (images.length === 0) errors.images = "Add at least one image";
  return errors;
};

const Field = ({ label, error, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
    {children}
    {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
  </label>
);

const inputClass = (error) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
    error ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
  }`;

const Section = ({ title, children }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <h2 className="mb-4 font-bold text-gray-900">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);

// Shared by Add Product and Edit Product. onSubmit receives ready-to-send FormData.
const ProductForm = ({ product, submitLabel, onSubmit }) => {
  const [values, setValues] = useState(() => toFormState(product));
  const [images, setImages] = useState(() =>
    (product?.productImg || []).map((img) => ({ key: img.public_id || img.url, url: img.url, public_id: img.public_id })),
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const knownCategory = CATEGORY_GROUPS.some((g) => g.categories.some((c) => c.name === values.category));
  const set = (name) => (e) => {
    setValues((prev) => ({ ...prev, [name]: e.target.value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const price = Number(values.productPrice) || 0;
  const discount = Number(values.discountPercentage) || 0;
  const mrp = discount > 0 && discount < 100 ? Math.round(price / (1 - discount / 100)) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, images);
    setErrors(found);
    if (Object.keys(found).length) return;

    const formData = new FormData();
    formData.append("productName", values.productName.trim());
    formData.append("brand", values.brand.trim());
    formData.append("category", values.category);
    formData.append("productDesc", values.productDesc.trim());
    formData.append("productPrice", String(price));
    formData.append("discountPercentage", String(discount));
    formData.append("stock", values.stock === "" ? "" : String(values.stock));
    if (product) {
      formData.append("existingImages", JSON.stringify(images.filter((img) => !img.file).map((img) => img.public_id)));
    }
    images.filter((img) => img.file).forEach((img) => formData.append("file", img.file));

    try {
      setSaving(true);
      await onSubmit(formData);
    } finally {
      setSaving(false);
    }
  };

  const preview = {
    _id: product?._id || "preview",
    productName: values.productName || "Product name",
    brand: values.brand,
    productPrice: price,
    discountPercentage: discount,
    rating: product?.rating,
    stock: values.stock === "" ? undefined : Number(values.stock),
    productImg: images.slice(0, 1).map((img) => ({ url: img.url })),
  };

  // the preview column only sits beside the form from xl; at lg (next to the admin sidebar) it would be ~220px wide
  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="min-w-0 space-y-6 xl:col-span-2">
        <Section title="Basic information">
          <Field label="Product name" error={errors.productName}>
            <input value={values.productName} onChange={set("productName")} placeholder="e.g. iPhone 15 Pro (256 GB)" className={inputClass(errors.productName)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand" error={errors.brand}>
              <input value={values.brand} onChange={set("brand")} placeholder="e.g. Apple" className={inputClass(errors.brand)} />
            </Field>
            <Field label="Category" error={errors.category}>
              <select value={values.category} onChange={set("category")} className={`${inputClass(errors.category)} cursor-pointer bg-white`}>
                <option value="">Select a category</option>
                {CATEGORY_GROUPS.map((group) => (
                  <optgroup key={group.slug} label={group.name}>
                    {group.categories.map((c) => (
                      <option key={c.slug} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                ))}
                {values.category && !knownCategory && <option value={values.category}>{values.category}</option>}
              </select>
            </Field>
          </div>
          <Field label="Description" error={errors.productDesc}>
            <textarea
              value={values.productDesc}
              onChange={set("productDesc")}
              rows={5}
              placeholder="Key features, specifications and what's in the box"
              className={inputClass(errors.productDesc)}
            />
          </Field>
        </Section>

        <Section title="Pricing & inventory">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Selling price (₹)" error={errors.productPrice}>
              <input type="number" min="1" value={values.productPrice} onChange={set("productPrice")} placeholder="0" className={inputClass(errors.productPrice)} />
            </Field>
            <Field
              label="Discount (%)"
              error={errors.discountPercentage}
              hint={mrp ? `MRP shown: ${formatPrice(mrp)}` : "0 = no discount"}
            >
              <input type="number" min="0" max="90" value={values.discountPercentage} onChange={set("discountPercentage")} className={inputClass(errors.discountPercentage)} />
            </Field>
            <Field label="Stock" error={errors.stock} hint="Leave empty to not track stock">
              <input type="number" min="0" value={values.stock} onChange={set("stock")} placeholder="Not tracked" className={inputClass(errors.stock)} />
            </Field>
          </div>
        </Section>

        <Section title="Images">
          <ImageUpload images={images} setImages={(next) => {
            setImages(next);
            if (errors.images) setErrors((prev) => ({ ...prev, images: undefined }));
          }} />
          {errors.images && <p className="text-xs text-red-600">{errors.images}</p>}
        </Section>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Store preview</p>
          <div className="pointer-events-none mx-auto max-w-60" aria-hidden>
            <ProductCard product={preview} />
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to="/dashboard/products"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
