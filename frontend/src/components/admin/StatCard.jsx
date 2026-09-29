import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
  pink: "bg-pink-50 text-pink-600",
  red: "bg-red-50 text-red-600",
  gray: "bg-gray-100 text-gray-600",
};

const Delta = ({ change, previousLabel }) => {
  if (change === null || change === undefined) {
    return <p className="mt-2 text-xs text-gray-400">No data for {previousLabel}</p>;
  }
  const rounded = Math.round(change * 10) / 10;
  const Icon = rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : Minus;
  const color = rounded > 0 ? "text-green-700" : rounded < 0 ? "text-red-600" : "text-gray-500";
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1 text-xs">
      <span className={`inline-flex items-center font-semibold ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {Math.abs(rounded)}%
      </span>
      <span className="text-gray-400">vs {previousLabel}</span>
    </p>
  );
};

const StatCard = ({ label, value, icon, tone = "blue", change, previousLabel, hint }) => {
  const Icon = icon;
  // @container: the value's size follows the card's own width (cards sit in 1-4 column grids)
  return (
  <div className="@container rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <p className="min-w-0 text-sm font-medium text-gray-500">{label}</p>
      {Icon && (
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
    <p className="mt-1 text-2xl font-bold wrap-break-word text-gray-900 tabular-nums @2xs:text-3xl">{value}</p>
    {previousLabel ? <Delta change={change} previousLabel={previousLabel} /> : hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
  </div>
  );
};

export default StatCard;
