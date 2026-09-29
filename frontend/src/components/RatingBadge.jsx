import React from "react";
import { Star } from "lucide-react";

const RatingBadge = ({ rating, className = "" }) => {
  if (!rating) return null;
  const color = rating >= 3.5 ? "bg-green-600" : rating >= 2.5 ? "bg-amber-500" : "bg-red-500";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold text-white ${color} ${className}`}
    >
      {rating.toFixed(1)}
      <Star className="h-3 w-3 fill-current" />
    </span>
  );
};

export default RatingBadge;
