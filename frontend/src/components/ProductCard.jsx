import React from "react";
import { Link } from "react-router-dom";
import { ImageOff, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RatingBadge from "./RatingBadge";
import useAddToCart from "../hooks/useAddToCart";
import { formatPrice, getMrp, isOutOfStock, productImage } from "../lib/catalog";

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
    <Skeleton className="aspect-square w-full rounded-none" />
    <div className="space-y-2 p-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
  </div>
);

const ProductCard = ({ product }) => {
  const { addToCart, addingId } = useAddToCart();
  const { _id, productName, productPrice, brand, rating, discountPercentage } = product;
  const image = productImage(product);
  const mrp = getMrp(product);
  const soldOut = isOutOfStock(product);
  const adding = addingId === _id;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/products/${_id}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        {image ? (
          <img
            src={image}
            alt={productName}
            loading="lazy"
            className="h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {discountPercentage > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-pink-600 px-2 py-0.5 text-xs font-bold text-white shadow">
            {discountPercentage}% OFF
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-gray-900/75 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {brand && (
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-gray-400">{brand}</p>
        )}
        <Link
          to={`/products/${_id}`}
          title={productName}
          className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-gray-800 wrap-break-word hover:text-pink-600"
        >
          {productName}
        </Link>
        <RatingBadge rating={rating} className="w-max" />
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <span className="text-lg font-bold text-gray-900">{formatPrice(productPrice)}</span>
          {mrp && <span className="text-sm text-gray-400 line-through">{formatPrice(mrp)}</span>}
          {discountPercentage > 0 && (
            <span className="text-sm font-semibold text-green-600">{discountPercentage}% off</span>
          )}
        </div>
        {/* smaller text/padding on phones so the label fits two-up cards (~130px wide) */}
        <Button
          onClick={() => addToCart(_id)}
          disabled={soldOut || adding}
          className="mt-2 w-full cursor-pointer gap-1.5 bg-pink-600 px-2 text-xs hover:bg-pink-700 has-[>svg]:px-2 sm:text-sm"
        >
          {adding ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
          {soldOut ? "Sold out" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
