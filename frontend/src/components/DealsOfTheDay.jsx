import React, { useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";
import ProductRow from "./ProductRow";

const msUntilMidnight = () => {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - Date.now();
};

const Countdown = () => {
  const [left, setLeft] = useState(msUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => setLeft(msUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = Math.floor(left / 1000);
  const parts = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60];

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Timer className="h-4 w-4 text-pink-600" />
      <span className="hidden sm:inline">Ends in</span>
      <div className="flex items-center gap-1 font-mono font-bold">
        {parts.map((value, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-400">:</span>}
            <span className="rounded-md bg-gray-900 px-1.5 py-0.5 text-white">{String(value).padStart(2, "0")}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const DealsOfTheDay = ({ products = [], loading }) => {
  const deals = useMemo(
    () =>
      [...products]
        .filter((p) => p.discountPercentage > 0 && p.stock !== 0)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)
        .slice(0, 12),
    [products],
  );

  return (
    <ProductRow
      title="Deals of the Day"
      subtitle="Biggest discounts across the store"
      viewAllTo="/products?sort=discount"
      products={deals}
      loading={loading}
      extra={<Countdown />}
    />
  );
};

export default DealsOfTheDay;
